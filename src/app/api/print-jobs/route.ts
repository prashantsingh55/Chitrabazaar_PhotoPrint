import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PrintJobStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, studioId } = session.user;
    const url = new URL(req.url);
    const status = url.searchParams.get('status') as PrintJobStatus | null;

    let whereClause: Record<string, unknown> = {};

    if (role === 'STUDIO_ADMIN') {
      if (!studioId) {
        return NextResponse.json({ printJobs: [] });
      }
      whereClause.studioId = studioId;
    } else if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (status && Object.values(PrintJobStatus).includes(status)) {
      whereClause.status = status;
    }

    const printJobs = await prisma.printJob.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            orderNumber: true,
            deliveryMethod: true,
            deliveryState: true,
            createdAt: true,
            customer: { select: { name: true, phone: true } },
          },
        },
        orderItem: true,
        studio: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ printJobs });
  } catch (error) {
    console.error('Failed to get print jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch print jobs' }, { status: 500 });
  }
}
