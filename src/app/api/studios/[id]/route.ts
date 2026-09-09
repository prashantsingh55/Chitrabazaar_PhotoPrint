import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role, StudioStatus } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studio = await prisma.photoStudio.findUnique({
      where: { id: params.id },
      include: {
        users: { select: { id: true, name: true, email: true, phone: true } },
        payouts: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { orders: true } },
      },
    });

    if (!studio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    return NextResponse.json({ studio });
  } catch (error) {
    console.error('Failed to get studio:', error);
    return NextResponse.json({ error: 'Failed to get studio' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, studioId: userStudioId } = session.user;
    const isSuperAdmin = role === Role.SUPER_ADMIN;
    const isOwnerStudio = role === Role.STUDIO_ADMIN && userStudioId === params.id;

    if (!isSuperAdmin && !isOwnerStudio) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    // Fields studio staff or admin can update
    if (body.name) updateData.name = body.name;
    if (body.ownerName) updateData.ownerName = body.ownerName;
    if (body.phone) updateData.phone = body.phone;
    if (body.address) updateData.address = body.address;
    if (body.city) updateData.city = body.city;
    if (body.pincode) updateData.pincode = body.pincode;
    if (body.workingHours) updateData.workingHours = body.workingHours;
    if (body.servicesOffered) updateData.servicesOffered = body.servicesOffered;

    // Fields only Super Admin can update
    if (isSuperAdmin) {
      if (body.status && Object.values(StudioStatus).includes(body.status)) {
        updateData.status = body.status;
      }
      if (body.commissionRate !== undefined) {
        updateData.commissionRate = parseFloat(body.commissionRate);
      }
    }

    const updated = await prisma.photoStudio.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, studio: updated });
  } catch (error) {
    console.error('Failed to update studio:', error);
    return NextResponse.json({ error: 'Failed to update studio' }, { status: 500 });
  }
}
