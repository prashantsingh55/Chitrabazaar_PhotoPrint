import { NextRequest, NextResponse } from 'next/server';
import { verifyEsewaCallback } from '@/modules/payments';
import { settleOrderPayment } from '@/modules/orders';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const encodedData = url.searchParams.get('data');

    if (!encodedData) {
      return NextResponse.json({ error: 'Missing eSewa callback payload' }, { status: 400 });
    }

    const { valid, decoded } = verifyEsewaCallback(encodedData);
    if (!valid || !decoded) {
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 400 });
    }

    const transactionId = String(decoded.transaction_code || decoded.transaction_uuid);
    const orderId = String(decoded.transaction_uuid); // UUID passed as order identifier
    const totalAmount = Number(decoded.total_amount);

    console.log(`[eSewa Webhook] Verified payment for Order ${orderId}, txn: ${transactionId}`);

    await settleOrderPayment({
      orderId,
      paymentMethod: 'ESEWA',
      transactionId,
      amount: totalAmount,
    });

    // Redirect user to order confirmation page
    return NextResponse.redirect(new URL(`/orders/${orderId}?payment=success`, req.url));
  } catch (error) {
    console.error('[eSewa Webhook] Processing error:', error);
    return NextResponse.json({ error: 'Failed to process payment callback' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Support server-to-server IPN push
  try {
    const body = await req.json();
    const encodedData = body.data;

    if (!encodedData) {
      return NextResponse.json({ error: 'Missing data field' }, { status: 400 });
    }

    const { valid, decoded } = verifyEsewaCallback(encodedData);
    if (!valid || !decoded) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const transactionId = String(decoded.transaction_code || decoded.transaction_uuid);
    const orderId = String(decoded.transaction_uuid);
    const totalAmount = Number(decoded.total_amount);

    await settleOrderPayment({
      orderId,
      paymentMethod: 'ESEWA',
      transactionId,
      amount: totalAmount,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[eSewa Webhook POST] Error:', error);
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }
}
