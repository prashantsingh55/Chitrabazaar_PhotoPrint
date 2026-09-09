import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== Role.SUPER_ADMIN) {
      return new Response('Unauthorized', { status: 403 });
    }

    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        studio: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'OrderNumber',
      'CreatedAt',
      'CustomerName',
      'CustomerEmail',
      'StudioName',
      'StudioCity',
      'PrintsCount',
      'DeliveryMethod',
      'Subtotal',
      'DeliveryFee',
      'PlatformFee',
      'TotalAmount',
      'Status',
      'PaymentStatus',
    ];

    const rows = orders.map((o) => [
      o.orderNumber,
      o.createdAt.toISOString(),
      `"${o.customer?.name || ''}"`,
      `"${o.customer?.email || ''}"`,
      `"${o.studio?.name || ''}"`,
      `"${o.studio?.city || ''}"`,
      o.items.reduce((acc, i) => acc + i.quantity, 0),
      o.deliveryMethod,
      o.subtotal.toFixed(2),
      o.deliveryFee.toFixed(2),
      o.platformFee.toFixed(2),
      o.totalAmount.toFixed(2),
      o.status,
      o.paymentStatus,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="chitrabazaar_orders_export_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV Export error:', error);
    return new Response('Failed to generate export', { status: 500 });
  }
}
