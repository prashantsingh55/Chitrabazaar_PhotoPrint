import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role, StudioStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(req.url);
    const all = url.searchParams.get('all') === 'true';

    // If super admin requested all, show all studios including pending/inactive
    const isAdmin = session?.user?.role === Role.SUPER_ADMIN;

    const studios = await prisma.photoStudio.findMany({
      where: isAdmin && all ? {} : { status: StudioStatus.ACTIVE },
      orderBy: [{ rating: 'desc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    return NextResponse.json({ studios });
  } catch (error) {
    console.error('Failed to fetch studios:', error);
    return NextResponse.json({ error: 'Failed to fetch studios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      ownerName,
      email,
      phone,
      address,
      city,
      pincode,
      commissionRate,
      workingHours,
      servicesOffered,
      password,
    } = body;

    if (!name || !email || !city || !pincode || !address) {
      return NextResponse.json({ error: 'Missing required studio fields' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already used
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A user with this studio email already exists' },
        { status: 400 }
      );
    }

    // Create studio
    const studio = await prisma.photoStudio.create({
      data: {
        name,
        ownerName: ownerName || name,
        email: cleanEmail,
        phone: phone || '',
        address,
        city,
        pincode,
        status: StudioStatus.ACTIVE,
        commissionRate: parseFloat(commissionRate || '15.0'),
        workingHours: workingHours || '9:00 AM - 8:00 PM',
        servicesOffered: servicesOffered || '4x6, 5x7, A4, 8x10, Passport, Glossy, Matte',
      },
    });

    // Create Studio Admin user account
    const passwordHash = await bcrypt.hash(password || 'studio123', 10);
    const user = await prisma.user.create({
      data: {
        name: ownerName || `${name} Staff`,
        email: cleanEmail,
        phone,
        passwordHash,
        role: Role.STUDIO_ADMIN,
        studioId: studio.id,
      },
    });

    return NextResponse.json({ success: true, studio, user });
  } catch (error) {
    console.error('Failed to create studio:', error);
    return NextResponse.json({ error: 'Failed to create studio' }, { status: 500 });
  }
}
