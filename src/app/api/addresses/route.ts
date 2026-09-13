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
    const { id, label, fullName, phone, line1, city, pincode, lat, lng, isDefault } = body;

    if (!line1 || !city || !pincode) {
      return NextResponse.json({ error: 'Missing required address fields (street, city, pincode)' }, { status: 400 });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    // If id is provided, update existing
    if (id) {
      const existing = await prisma.address.findFirst({
        where: { id, userId: session.user.id },
      });
      if (existing) {
        const updated = await prisma.address.update({
          where: { id },
          data: {
            label: label || existing.label,
            fullName: fullName || existing.fullName,
            phone: phone !== undefined ? phone : existing.phone,
            line1,
            city,
            pincode,
            lat: lat !== undefined ? (lat ? parseFloat(lat) : null) : existing.lat,
            lng: lng !== undefined ? (lng ? parseFloat(lng) : null) : existing.lng,
            isDefault: isDefault !== undefined ? !!isDefault : existing.isDefault,
          },
        });
        return NextResponse.json({ success: true, address: updated });
      }
    }

    // Check if user already has an address with this label (e.g. Home or Work) and update it
    const existingWithLabel = await prisma.address.findFirst({
      where: { userId: session.user.id, label: label || 'Home' },
    });

    if (existingWithLabel) {
      const updated = await prisma.address.update({
        where: { id: existingWithLabel.id },
        data: {
          fullName: fullName || session.user.name,
          phone,
          line1,
          city,
          pincode,
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
          isDefault: !!isDefault,
        },
      });
      return NextResponse.json({ success: true, address: updated });
    }

    // Otherwise create new address
    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        label: label || 'Home',
        fullName: fullName || session.user.name,
        phone,
        line1,
        city,
        pincode,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        isDefault: !!isDefault,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (error) {
    console.error('Failed to create or update address:', error);
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, label, fullName, phone, line1, city, pincode, lat, lng, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    const existing = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Address not found or permission denied' }, { status: 404 });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        label: label || existing.label,
        fullName: fullName !== undefined ? fullName : existing.fullName,
        phone: phone !== undefined ? phone : existing.phone,
        line1: line1 || existing.line1,
        city: city || existing.city,
        pincode: pincode || existing.pincode,
        lat: lat !== undefined ? (lat ? parseFloat(lat) : null) : existing.lat,
        lng: lng !== undefined ? (lng ? parseFloat(lng) : null) : existing.lng,
        isDefault: isDefault !== undefined ? !!isDefault : existing.isDefault,
      },
    });

    return NextResponse.json({ success: true, address: updated });
  } catch (error) {
    console.error('Failed to update address:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    const existing = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Address not found or permission denied' }, { status: 404 });
    }

    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    console.error('Failed to delete address:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
