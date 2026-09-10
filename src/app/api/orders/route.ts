import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  OrderStatus,
  PrintJobStatus,
  DeliveryMethod,
  PaymentStatus,
  PrintSize,
  PaperType,
  PrintFinish,
  RecipientType,
  StudioStatus,
  Prisma,
} from '@prisma/client';
import {
  PRINT_SIZE_PRICES,
  PAPER_TYPE_SURCHARGES,
  generateOrderNumber,
} from '@/lib/utils';
import { sendNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId, studioId } = session.user;
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    let whereClause: Record<string, unknown> = {};

    if (role === 'CUSTOMER') {
      whereClause = { customerId: userId };
    } else if (role === 'STUDIO_ADMIN') {
      if (!studioId) {
        return NextResponse.json({ orders: [] });
      }
      whereClause = { studioId };
    } else if (role === 'SUPER_ADMIN') {
      // Super admin sees all orders
      whereClause = {};
    }

    if (status && status !== 'ALL' && Object.values(OrderStatus).includes(status as OrderStatus)) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        studio: { select: { id: true, name: true, phone: true, city: true, address: true } },
        items: {
          include: {
            printJob: true,
          },
        },
        deliveryAddress: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to get orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Please log in to place an order' }, { status: 401 });
    }

    const body = await req.json();
    const {
      items,
      deliveryMethod,
      studioId: requestedStudioId,
      deliveryAddress,
      paymentMethod = 'MOCK_PAYMENT',
      notes,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // 1. Resolve Studio Assignment
    let assignedStudioId = requestedStudioId;
    if (!assignedStudioId || assignedStudioId === 'auto') {
      // Auto-assign top rated active studio
      const defaultStudio = await prisma.photoStudio.findFirst({
        where: { status: StudioStatus.ACTIVE },
        orderBy: { rating: 'desc' },
      });
      if (!defaultStudio) {
        return NextResponse.json(
          { error: 'No active partner studios are currently available in your region' },
          { status: 400 }
        );
      }
      assignedStudioId = defaultStudio.id;
    }

    const targetStudio = await prisma.photoStudio.findUnique({
      where: { id: assignedStudioId },
    });

    if (!targetStudio || targetStudio.status !== StudioStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'The selected photo studio is currently not accepting new orders' },
        { status: 400 }
      );
    }

    // 2. Handle Delivery Address
    let addressId: string | undefined = undefined;
    if (deliveryMethod === DeliveryMethod.DELIVERY) {
      if (deliveryAddress?.id) {
        addressId = deliveryAddress.id;
      } else if (deliveryAddress?.line1 && deliveryAddress?.city && deliveryAddress?.pincode) {
        const newAddress = await prisma.address.create({
          data: {
            userId: session.user.id,
            label: deliveryAddress.label || 'Home',
            fullName: deliveryAddress.fullName || session.user.name,
            phone: deliveryAddress.phone,
            line1: deliveryAddress.line1,
            city: deliveryAddress.city,
            pincode: deliveryAddress.pincode,
          },
        });
        addressId = newAddress.id;
      } else {
        return NextResponse.json({ error: 'Please provide a valid delivery address' }, { status: 400 });
      }
    }

    // 3. Server-side authoritative price calculation
    let calculatedSubtotal = 0;
    const orderItemsData: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    for (const item of items) {
      const validSize = Object.values(PrintSize).includes(item.size) ? item.size : PrintSize.SIZE_4X6;
      const validPaper = Object.values(PaperType).includes(item.paperType) ? item.paperType : PaperType.GLOSSY;
      const validFinish = Object.values(PrintFinish).includes(item.finish) ? item.finish : PrintFinish.BORDERLESS;

      const basePrice = PRINT_SIZE_PRICES[validSize] || 1.2;
      const paperSur = PAPER_TYPE_SURCHARGES[validPaper] || 0;
      const unitPrice = basePrice + paperSur;
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const itemTotal = unitPrice * qty;

      calculatedSubtotal += itemTotal;

      orderItemsData.push({
        photoUrl: item.url,
        originalFilename: item.filename || 'photo.jpg',
        size: validSize,
        paperType: validPaper,
        finish: validFinish,
        quantity: qty,
        unitPrice,
        totalPrice: itemTotal,
        cropRotation: item.rotation || 0,
        cropAspect: item.aspect || 'original',
      });
    }

    const deliveryFee = deliveryMethod === DeliveryMethod.DELIVERY ? 4.99 : 0.0;
    const platformFee = 1.5; // Platform commission / service charge
    const totalAmount = parseFloat((calculatedSubtotal + deliveryFee + platformFee).toFixed(2));

    const orderNumber = generateOrderNumber();
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const pickupPin = deliveryMethod === DeliveryMethod.DELIVERY ? null : Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Create Order + OrderItems + Payment + PrintJobs atomically in database
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: session.user.id,
          studioId: targetStudio.id,
          status: OrderStatus.PLACED,
          deliveryMethod: deliveryMethod === DeliveryMethod.DELIVERY ? DeliveryMethod.DELIVERY : DeliveryMethod.PICKUP,
          deliveryAddressId: addressId,
          pickupPin,
          subtotal: calculatedSubtotal,
          deliveryFee,
          platformFee,
          totalAmount,
          paymentStatus: PaymentStatus.PAID,
          notes: notes || '',
          items: {
            create: orderItemsData,
          },
          payments: {
            create: {
              amount: totalAmount,
              currency: '$',
              method: paymentMethod,
              status: PaymentStatus.PAID,
              transactionId,
            },
          },
        },
        include: {
          items: true,
          studio: true,
        },
      });

      // Create PrintJob records for darkroom press tracking
      for (let idx = 0; idx < createdOrder.items.length; idx++) {
        const item = createdOrder.items[idx];
        const paddedIdx = String(idx + 1).padStart(2, '0');
        const jobDocketNumber = `JOB-${createdOrder.orderNumber}-${paddedIdx}`;

        await tx.printJob.create({
          data: {
            orderId: createdOrder.id,
            orderItemId: item.id,
            studioId: createdOrder.studioId,
            status: PrintJobStatus.PENDING,
            rawAssetKey: item.photoUrl,
            jobDocketNumber,
          },
        });
      }

      return createdOrder;
    });

    // 5. Enqueue Async Background Processing Jobs
    const { enqueueMediaProcessing, enqueuePrintJob } = await import('@/lib/queue');
    const createdPrintJobs = await prisma.printJob.findMany({
      where: { orderId: order.id },
      include: { orderItem: true },
    });

    for (const job of createdPrintJobs) {
      await enqueueMediaProcessing({
        printJobId: job.id,
        orderId: job.orderId,
        orderItemId: job.orderItemId,
        rawAssetKey: job.rawAssetKey,
        targetSize: job.orderItem.size,
        paperType: job.orderItem.paperType,
        finish: job.orderItem.finish,
        cropRotation: job.orderItem.cropRotation,
        cropAspect: job.orderItem.cropAspect || undefined,
      });

      if (job.studioId) {
        await enqueuePrintJob({
          printJobId: job.id,
          orderId: job.orderId,
          studioId: job.studioId,
          jobDocketNumber: job.jobDocketNumber,
        });
      }
    }

    // 6. Trigger Real-Time Notification to Assigned Photo Studio!
    await sendNotification({
      recipientType: RecipientType.STUDIO,
      recipientId: targetStudio.id,
      title: `🚨 NEW ORDER RECEIVED: ${order.orderNumber}`,
      message: `${session.user.name || 'A customer'} placed an order for ${order.items.length} print items. Immediate review required.`,
      link: `/studio/orders/${order.id}`,
    });

    // 7. Trigger Confirmation Notification to Customer
    const pickupNotice = pickupPin ? ` Your counter pickup PIN is: ${pickupPin}.` : '';
    await sendNotification({
      recipientType: RecipientType.CUSTOMER,
      recipientId: session.user.id,
      title: `📸 Order ${order.orderNumber} Confirmed!`,
      message: `Your print job has been assigned to ${targetStudio.name}.${pickupNotice}`,
      link: `/orders/${order.id}`,
      customerEmail: session.user.email || undefined,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      order,
    });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json({ error: 'Failed to place order. Please try again.' }, { status: 500 });
  }
}
