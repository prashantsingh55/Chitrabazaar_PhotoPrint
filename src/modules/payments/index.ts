import Stripe from 'stripe';
import crypto from 'crypto';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
export const stripeClient = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' as any })
  : null;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// eSewa EPAY v2 configuration
export const ESEWA_MERCHANT_ID = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
export const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q'; // Default test secret
export const ESEWA_GATEWAY_URL =
  process.env.ESEWA_GATEWAY_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

export interface CreatePaymentSessionParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Creates a Stripe Checkout Session.
 */
export async function createStripeCheckoutSession(params: CreatePaymentSessionParams) {
  if (!stripeClient) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in environment.');
  }

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: params.customerEmail,
    client_reference_id: params.orderId,
    metadata: {
      orderId: params.orderId,
      orderNumber: params.orderNumber,
    },
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase() === '$' ? 'usd' : params.currency.toLowerCase(),
          product_data: {
            name: `Chitrabazaar Order ${params.orderNumber}`,
            description: 'Archival Darkroom Photo Prints & Dispatch',
          },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}

/**
 * Generates an eSewa HMAC-SHA256 signature for secure payment initialization.
 * eSewa v2 signature format: "total_amount,transaction_uuid,product_code"
 */
export function generateEsewaSignature(
  totalAmount: string,
  transactionUuid: string,
  productCode: string = ESEWA_MERCHANT_ID
): string {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const hmac = crypto.createHmac('sha256', ESEWA_SECRET_KEY);
  hmac.update(message);
  return hmac.digest('base64');
}

/**
 * Validates an incoming eSewa payment callback signature.
 */
export function verifyEsewaCallback(
  encodedData: string
): { valid: boolean; decoded?: Record<string, unknown> } {
  try {
    const jsonStr = Buffer.from(encodedData, 'base64').toString('utf-8');
    const parsed = JSON.parse(jsonStr);

    // Verify signature
    const { total_amount, transaction_uuid, product_code, signature } = parsed;
    const expectedSignature = generateEsewaSignature(
      String(total_amount),
      String(transaction_uuid),
      String(product_code)
    );

    return {
      valid: expectedSignature === signature,
      decoded: parsed,
    };
  } catch {
    return { valid: false };
  }
}
