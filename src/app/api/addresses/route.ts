import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Failed to get addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { label, fullName, phone, line1, city, pincode, isDefault } = body;

    if (!line1 || !city || !pincode) {
      return NextResponse.json({ error: 'Missing required address fields' }, { status: 400 });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        label: label || 'Home',
        fullName: fullName || session.user.name,
        phone,
        line1,
        city,
        pincode,
        isDefault: !!isDefault,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (error) {
    console.error('Failed to create address:', error);
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
  }
}
