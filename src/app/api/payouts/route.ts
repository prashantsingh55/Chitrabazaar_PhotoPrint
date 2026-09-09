import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, studioId } = session.user;
    const url = new URL(req.url);
    const targetStudioId = url.searchParams.get('studioId');

    let whereClause: Record<string, unknown> = {};

    if (role === Role.STUDIO_ADMIN) {
      if (!studioId) return NextResponse.json({ payouts: [] });
      whereClause = { studioId };
    } else if (role === Role.SUPER_ADMIN) {
      if (targetStudioId) {
        whereClause = { studioId: targetStudioId };
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payouts = await prisma.payout.findMany({
      where: whereClause,
      include: {
        studio: { select: { id: true, name: true, ownerName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error('Failed to get payouts:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}
