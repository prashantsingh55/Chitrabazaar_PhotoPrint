import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { Role, StudioStatus } from '@prisma/client';
import { sendNotification } from '@/lib/notifications';
import { RecipientType } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, name, email, password, phone, studioName, ownerName, address, city, pincode } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (type === 'studio') {
      if (!studioName || !city || !pincode || !address) {
        return NextResponse.json({ error: 'Please provide full studio location and details' }, { status: 400 });
      }

      // Create Pending Photo Studio
      const studio = await prisma.photoStudio.create({
        data: {
          name: studioName,
          ownerName: ownerName || name,
          email: cleanEmail,
          phone: phone || '',
          address,
          city,
          pincode,
          status: StudioStatus.PENDING,
          commissionRate: 15.0,
        },
      });

      // Create Studio Admin User
      const user = await prisma.user.create({
        data: {
          name,
          email: cleanEmail,
          phone,
          passwordHash,
          role: Role.STUDIO_ADMIN,
          studioId: studio.id,
        },
      });

      // Alert Super Admin
      await sendNotification({
        recipientType: RecipientType.SUPER_ADMIN,
        recipientId: 'ALL_ADMINS',
        title: '🏢 New Studio Partner Application',
        message: `${studioName} (${city}) registered for verification.`,
        link: `/admin/studios/${studio.id}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Studio partner application submitted! An admin will review your profile.',
        user: { id: user.id, email: user.email, role: user.role },
      });
    }

    // Default: Customer registration
    const user = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        phone,
        passwordHash,
        role: Role.CUSTOMER,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now log in.',
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}
