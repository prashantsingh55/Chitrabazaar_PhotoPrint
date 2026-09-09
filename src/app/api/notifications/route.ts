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

    const { role, id: userId, studioId } = session.user;
    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';

    let recipientIds: string[] = [userId];

    if (role === Role.STUDIO_ADMIN && studioId) {
      recipientIds.push(studioId);
    } else if (role === Role.SUPER_ADMIN) {
      recipientIds.push('ALL_ADMINS');
    }

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: { in: recipientIds },
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, markAll } = await req.json();

    if (markAll) {
      const { role, id: userId, studioId } = session.user;
      const recipientIds: string[] = [userId];
      if (role === Role.STUDIO_ADMIN && studioId) recipientIds.push(studioId);
      if (role === Role.SUPER_ADMIN) recipientIds.push('ALL_ADMINS');

      await prisma.notification.updateMany({
        where: { recipientId: { in: recipientIds }, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
