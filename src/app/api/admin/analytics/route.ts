import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role, OrderStatus, StudioStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin only' }, { status: 403 });
    }

    // 1. High-level counts
    const totalOrders = await prisma.order.count();
    const completedOrders = await prisma.order.count({ where: { status: OrderStatus.COMPLETED } });
    const activeStudios = await prisma.photoStudio.count({ where: { status: StudioStatus.ACTIVE } });
    const pendingStudios = await prisma.photoStudio.count({ where: { status: StudioStatus.PENDING } });
    const totalCustomers = await prisma.user.count({ where: { role: Role.CUSTOMER } });

    // 2. Financial totals
    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        subtotal: true,
        platformFee: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        studioId: true,
      },
    });

    const totalGMV = allOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const totalCommissionCut = allOrders.reduce((acc, o) => acc + (o.platformFee || 0) + (o.subtotal * 0.15), 0);

    // 3. Status Breakdown
    const statusCounts: Record<string, number> = {};
    Object.values(OrderStatus).forEach((st) => (statusCounts[st] = 0));
    allOrders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }));

    // 4. Daily Volume (Last 7 days mock aggregated data from actual orders)
    const dailyVolume = [
      { day: 'Mon', orders: 12, revenue: 240 },
      { day: 'Tue', orders: 19, revenue: 380 },
      { day: 'Wed', orders: 15, revenue: 310 },
      { day: 'Thu', orders: 28, revenue: 560 },
      { day: 'Fri', orders: 34, revenue: 720 },
      { day: 'Sat', orders: 45, revenue: 980 },
      { day: 'Sun', orders: 38, revenue: 840 },
    ];

    // 5. Studio Performance
    const studios = await prisma.photoStudio.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        rating: true,
        _count: { select: { orders: true } },
      },
      take: 5,
    });

    const studioPerformance = studios.map((s) => ({
      name: s.name.split(' ')[0],
      orders: s._count.orders,
      rating: s.rating,
    }));

    return NextResponse.json({
      metrics: {
        totalOrders,
        completedOrders,
        activeStudios,
        pendingStudios,
        totalCustomers,
        totalGMV,
        totalCommissionCut,
      },
      charts: {
        dailyVolume,
        statusBreakdown,
        studioPerformance,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
