import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { DeliveryStatus, OrderStatus } from '@prisma/client';

/**
 * Generates an archival 6-digit numeric verification PIN for in-person studio counter collection.
 */
export function generatePickupPin(): string {
  const pinInt = crypto.randomInt(100000, 999999);
  return String(pinInt);
}

/**
 * Verifies counter pickup PIN when customer arrives at studio.
 */
export async function verifyPickupPin(orderId: string, inputPin: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { pickupPin: true, deliveryMethod: true },
  });

  if (!order || !order.pickupPin) return false;
  return order.pickupPin.trim() === inputPin.trim();
}

/**
 * Updates an order's delivery state with tracking and timestamp.
 */
export async function updateDeliveryProgress(
  orderId: string,
  deliveryState: DeliveryStatus,
  courierData?: {
    courierName?: string;
    waybillNumber?: string;
    trackingUrl?: string;
  }
) {
  const isFinalDelivery = deliveryState === DeliveryStatus.DELIVERED || deliveryState === DeliveryStatus.PICKED_UP;

  return await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryState,
      ...(isFinalDelivery && { deliveredAt: new Date(), status: OrderStatus.COMPLETED }),
      ...(courierData?.courierName && { courierName: courierData.courierName }),
      ...(courierData?.waybillNumber && { waybillNumber: courierData.waybillNumber }),
      ...(courierData?.trackingUrl && { trackingUrl: courierData.trackingUrl }),
    },
  });
}
