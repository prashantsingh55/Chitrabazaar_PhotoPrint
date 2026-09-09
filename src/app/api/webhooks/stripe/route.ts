import { NextRequest, NextResponse } from 'next/server';
import { stripeClient, STRIPE_WEBHOOK_SECRET } from '@/modules/payments';
import { settleOrderPayment } from '@/modules/orders';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!stripeClient || !STRIPE_WEBHOOK_SECRET) {
      console.warn('[Stripe Webhook] Stripe is not configured with webhook secret.');
      return NextResponse.json(
        { error: 'Stripe webhook secret not configured' },
        { status: 500 }
      );
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(bodyText, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    // Handle payment completion events
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.client_reference_id || session.metadata?.orderId;
      const transactionId = session.payment_intent as string || session.id;
      const amount = (session.amount_total || 0) / 100;

      if (orderId) {
        console.log(`[Stripe Webhook] Verified payment for Order ${orderId}`);
        await settleOrderPayment({
          orderId,
          paymentMethod: 'STRIPE',
          transactionId,
          amount,
        });
      }
    } else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;
      const transactionId = paymentIntent.id;
      const amount = (paymentIntent.amount_received || paymentIntent.amount) / 100;

      if (orderId) {
        console.log(`[Stripe Webhook] PaymentIntent succeeded for Order ${orderId}`);
        await settleOrderPayment({
          orderId,
          paymentMethod: 'STRIPE',
          transactionId,
          amount,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
