import { updateDeliveryProgress } from '@/modules/delivery';
import { DeliveryPayload } from '@/lib/queue';
import { DeliveryStatus } from '@prisma/client';

export async function processDeliveryJob(job: { data: DeliveryPayload }) {
  const { orderId, deliveryMethod, action, metadata } = job.data;
  console.log(`[Delivery Worker] Processing ${action} for Order ${orderId} (${deliveryMethod})`);

  if (action === 'DISPATCH_COURIER' && metadata) {
    await updateDeliveryProgress(orderId, DeliveryStatus.OUT_FOR_DELIVERY, {
      courierName: metadata.courierName as string,
      waybillNumber: metadata.waybillNumber as string,
      trackingUrl: metadata.trackingUrl as string,
    });
  } else if (action === 'CONFIRM_DELIVERY') {
    await updateDeliveryProgress(
      orderId,
      deliveryMethod === 'PICKUP' ? DeliveryStatus.PICKED_UP : DeliveryStatus.DELIVERED
    );
  }
}
