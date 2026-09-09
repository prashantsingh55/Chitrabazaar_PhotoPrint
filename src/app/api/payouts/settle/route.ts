import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role, PayoutStatus, RecipientType } from '@prisma/client';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin only' }, { status: 403 });
    }

    const { payoutId, transactionRef, notes } = await req.json();

    if (!payoutId) {
      return NextResponse.json({ error: 'payoutId is required' }, { status: 400 });
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { studio: true },
    });

    if (!payout) {
      return NextResponse.json({ error: 'Payout record not found' }, { status: 404 });
    }

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.PAID,
        paidAt: new Date(),
        transactionRef: transactionRef || `NEFT-${Date.now()}`,
        notes: notes || payout.notes,
      },
    });

    // Notify studio of payout disbursement
    await sendNotification({
      recipientType: RecipientType.STUDIO,
      recipientId: payout.studioId,
      title: `💰 Payout Disbursed: $${payout.netPayout.toFixed(2)}`,
      message: `Chitrabazaar platform has settled your earnings for ${payout.orderIds.length} orders. Ref: ${updated.transactionRef}`,
      link: '/studio/profile',
    });

    return NextResponse.json({ success: true, payout: updated });
  } catch (error) {
    console.error('Failed to settle payout:', error);
    return NextResponse.json({ error: 'Failed to settle payout' }, { status: 500 });
  }
}
