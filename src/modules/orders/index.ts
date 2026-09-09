import prisma from '@/lib/prisma';
import {
  OrderStatus,
  PaymentStatus,
  PrintJobStatus,
  RecipientType,
  DeliveryMethod,
} from '@prisma/client';
import { generateJobDocketNumber } from '@/modules/print-jobs';
import { generatePickupPin } from '@/modules/delivery';
import {
  enqueueMediaProcessing,
  enqueuePrintJob,
  enqueueNotification,
} from '@/lib/queue';

export interface SettleOrderParams {
  orderId: string;
  paymentMethod: string;
  transactionId: string;
  amount: number;
}

/**
 * Authoritatively settles an order upon verified payment (Stripe webhook, eSewa IPN, or Mock).
 * Executes in a single ACID transaction:
 * 1. Updates Order to PAID / PLACED
 * 2. Issues 6-digit counter pickup PIN if Pickup mode
 * 3. Enrolls PrintJob records for darkroom press operators
 * 4. Enqueues async background jobs in pg-boss
 */
export async function settleOrderPayment(params: SettleOrderParams) {
  const { orderId, paymentMethod, transactionId, amount } = params;

  // Retrieve current order
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      studio: true,
      customer: true,
    },
  });

  if (!existingOrder) {
    throw new Error(`Order with ID ${orderId} not found`);
  }

  if (existingOrder.paymentStatus === PaymentStatus.PAID) {
    console.log(`[Order Settlement] Order ${existingOrder.orderNumber} is already marked PAID. Skipping duplicate.`);
    return existingOrder;
  }

  const pickupPin =
    existingOrder.deliveryMethod === DeliveryMethod.PICKUP
      ? existingOrder.pickupPin || generatePickupPin()
      : null;

  // Execute database state change in transaction
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // 1. Update Order
    const order = await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.PLACED,
        pickupPin,
      },
    });

    // 2. Record or update Payment
    await tx.payment.upsert({
      where: { transactionId },
      create: {
        orderId,
        amount,
        currency: '$',
        method: paymentMethod,
        status: PaymentStatus.PAID,
        transactionId,
      },
      update: {
        status: PaymentStatus.PAID,
      },
    });

    // 3. Create PrintJob records for every OrderItem
    for (let i = 0; i < existingOrder.items.length; i++) {
      const item = existingOrder.items[i];
      const jobDocketNumber = generateJobDocketNumber(order.orderNumber, i);

      // Check if PrintJob already exists
      const existingJob = await tx.printJob.findUnique({
        where: { orderItemId: item.id },
      });

      if (!existingJob) {
        await tx.printJob.create({
          data: {
            orderId: order.id,
            orderItemId: item.id,
            studioId: order.studioId,
            status: PrintJobStatus.PENDING,
            rawAssetKey: item.photoUrl,
            jobDocketNumber,
          },
        });
      }
    }

    return order;
  });

  // 4. Asynchronously enqueue background jobs in pg-boss
  // Fetch freshly created print jobs
  const printJobs = await prisma.printJob.findMany({
    where: { orderId },
    include: { orderItem: true },
  });

  for (const job of printJobs) {
    // Media processing queue (Sharp SIMD preflight & 300 DPI master render)
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

    // Print job queue (Darkroom plate routing)
    if (job.studioId) {
      await enqueuePrintJob({
        printJobId: job.id,
        orderId: job.orderId,
        studioId: job.studioId,
        jobDocketNumber: job.jobDocketNumber,
      });
    }
  }

  // 5. Enqueue Notifications
  if (existingOrder.studioId) {
    await enqueueNotification({
      recipientType: RecipientType.STUDIO,
      recipientId: existingOrder.studioId,
      title: `⚡ PAID COMMISSION: ${updatedOrder.orderNumber}`,
      message: `Payment verified for ${existingOrder.items.length} print plates. Ready for darkroom preflight.`,
      link: `/studio/orders/${updatedOrder.id}`,
    });
  }

  const pickupMessage = pickupPin
    ? ` Counter pickup PIN: ${pickupPin}. Present this PIN upon collection.`
    : '';

  await enqueueNotification({
    recipientType: RecipientType.CUSTOMER,
    recipientId: existingOrder.customerId,
    title: `📸 Order ${updatedOrder.orderNumber} Confirmed & Paid`,
    message: `Your photographs are entering the darkroom queue.${pickupMessage}`,
    link: `/orders/${updatedOrder.id}`,
    email: existingOrder.customer.email,
  });

  return updatedOrder;
}
