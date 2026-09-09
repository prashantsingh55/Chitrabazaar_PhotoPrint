import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role, RecipientType, StudioStatus } from '@prisma/client';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin only' }, { status: 403 });
    }

    const { title, message } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const activeStudios = await prisma.photoStudio.findMany({
      where: { status: StudioStatus.ACTIVE },
    });

    for (const studio of activeStudios) {
      await sendNotification({
        recipientType: RecipientType.STUDIO,
        recipientId: studio.id,
        title: `📢 HQ ANNOUNCEMENT: ${title}`,
        message,
        link: '/studio/dashboard',
      });
    }

    return NextResponse.json({
      success: true,
      notifiedStudiosCount: activeStudios.length,
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Failed to broadcast announcement' }, { status: 500 });
  }
}
