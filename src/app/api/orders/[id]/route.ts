import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { OrderStatus, Role, RecipientType, PayoutStatus } from '@prisma/client';
import { sendNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        studio: true,
        items: {
          include: {
            printJob: true,
          },
        },
        deliveryAddress: true,
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { role, id: userId, studioId } = session.user;
    const isOwnerCustomer = role === Role.CUSTOMER && order.customerId === userId;
    const isAssignedStudio = role === Role.STUDIO_ADMIN && order.studioId === studioId;
    const isSuperAdmin = role === Role.SUPER_ADMIN;

    if (!isOwnerCustomer && !isAssignedStudio && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Failed to get order detail:', error);
    return NextResponse.json({ error: 'Failed to fetch order detail' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, studioId, name: actorName } = session.user;
    const body = await req.json();
    const { status, cancellationReason, notes } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: { customer: true, studio: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isAssignedStudio = role === Role.STUDIO_ADMIN && existingOrder.studioId === studioId;
    const isSuperAdmin = role === Role.SUPER_ADMIN;
    const isCustomer = role === Role.CUSTOMER && existingOrder.customerId === session.user.id;

    // Customer can only cancel if it's still in PLACED status
    if (isCustomer) {
      if (status === OrderStatus.CANCELLED && existingOrder.status === OrderStatus.PLACED) {
        const cancelled = await prisma.order.update({
          where: { id: params.id },
          data: {
            status: OrderStatus.CANCELLED,
            cancellationReason: cancellationReason || 'Cancelled by customer before darkroom start',
          },
        });
        return NextResponse.json({ success: true, order: cancelled });
      } else {
        return NextResponse.json(
          { error: 'Order cannot be cancelled once printing has started' },
          { status: 400 }
        );
      }
    }

    if (!isAssignedStudio && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!Object.values(OrderStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        cancellationReason: status === OrderStatus.CANCELLED ? cancellationReason : undefined,
        notes: notes !== undefined ? notes : existingOrder.notes,
      },
    });

    // Notify Customer about status change
    let statusMessage = `Your order ${existingOrder.orderNumber} status changed to ${status}.`;
    if (status === OrderStatus.PRINTING) {
      statusMessage = `✨ ${existingOrder.studio?.name || 'Studio'} is now actively printing your photos!`;
    } else if (status === OrderStatus.READY) {
      statusMessage =
        existingOrder.deliveryMethod === 'PICKUP'
          ? `🎉 Your prints are ready for pickup at ${existingOrder.studio?.name}!`
          : `🚚 Your prints are packaged and out for delivery!`;
    } else if (status === OrderStatus.COMPLETED) {
      statusMessage = `✅ Order ${existingOrder.orderNumber} has been successfully completed. Thank you!`;
    }

    await sendNotification({
      recipientType: RecipientType.CUSTOMER,
      recipientId: existingOrder.customerId,
      title: `📸 Order Update: ${status}`,
      message: statusMessage,
      link: `/orders/${existingOrder.id}`,
      customerEmail: existingOrder.customer?.email,
    });

    // If completed and studio is assigned, register into Payout audit ledger if not already present
    if (status === OrderStatus.COMPLETED && existingOrder.studioId && existingOrder.studio) {
      const commissionRate = existingOrder.studio.commissionRate || 15.0;
      const grossAmount = existingOrder.subtotal;
      const commissionAmount = parseFloat(((grossAmount * commissionRate) / 100).toFixed(2));
      const netPayout = parseFloat((grossAmount - commissionAmount).toFixed(2));

      // Create or append to a pending payout record for this studio
      const existingPendingPayout = await prisma.payout.findFirst({
        where: {
          studioId: existingOrder.studioId,
          status: PayoutStatus.PENDING,
        },
      });

      if (existingPendingPayout) {
        if (!existingPendingPayout.orderIds.includes(existingOrder.id)) {
          await prisma.payout.update({
            where: { id: existingPendingPayout.id },
            data: {
              orderIds: { push: existingOrder.id },
              grossAmount: existingPendingPayout.grossAmount + grossAmount,
              commissionAmount: existingPendingPayout.commissionAmount + commissionAmount,
              netPayout: existingPendingPayout.netPayout + netPayout,
              periodEnd: new Date(),
            },
          });
        }
      } else {
        await prisma.payout.create({
          data: {
            studioId: existingOrder.studioId,
            periodStart: new Date(),
            periodEnd: new Date(),
            orderIds: [existingOrder.id],
            grossAmount,
            commissionAmount,
            netPayout,
            status: PayoutStatus.PENDING,
            notes: 'Accumulated from completed order batches',
          },
        });
      }
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Failed to update order status:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
