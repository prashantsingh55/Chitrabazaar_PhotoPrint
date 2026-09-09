import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role, RecipientType, OrderStatus } from '@prisma/client';
import { sendNotification } from '@/lib/notifications';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin only' }, { status: 403 });
    }

    const { newStudioId, reason } = await req.json();

    if (!newStudioId) {
      return NextResponse.json({ error: 'New Studio ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { studio: true, customer: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const newStudio = await prisma.photoStudio.findUnique({
      where: { id: newStudioId },
    });

    if (!newStudio) {
      return NextResponse.json({ error: 'Target studio not found' }, { status: 404 });
    }

    const oldStudioId = order.studioId;
    const oldStudioName = order.studio?.name || 'Previous Studio';

    // Update order assignment
    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        studioId: newStudio.id,
        status: OrderStatus.ASSIGNED,
        notes: `${order.notes || ''} [Reassigned from ${oldStudioName} to ${newStudio.name}. Reason: ${reason || 'Admin load balancing'}]`,
      },
    });

    // Alert new studio
    await sendNotification({
      recipientType: RecipientType.STUDIO,
      recipientId: newStudio.id,
      title: `🚨 REASSIGNED ORDER: ${order.orderNumber}`,
      message: `Chitrabazaar HQ reassigned order ${order.orderNumber} to your darkroom. Please review.`,
      link: `/studio/orders/${order.id}`,
    });

    // Alert old studio
    if (oldStudioId) {
      await sendNotification({
        recipientType: RecipientType.STUDIO,
        recipientId: oldStudioId,
        title: `ℹ️ Order ${order.orderNumber} Reassigned`,
        message: `Order ${order.orderNumber} has been reassigned to another studio by platform admin.`,
      });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Failed to reassign order:', error);
    return NextResponse.json({ error: 'Failed to reassign order' }, { status: 500 });
  }
}
