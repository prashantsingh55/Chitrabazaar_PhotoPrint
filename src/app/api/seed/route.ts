import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function POST(req: NextRequest) {
  // Gated: only available if not production or if super admin
  const session = await getServerSession(authOptions);
  const isDev = process.env.NODE_ENV !== 'production';
  const isAdmin = session?.user?.role === Role.SUPER_ADMIN;

  if (!isDev && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { stdout, stderr } = await execAsync('npx tsx prisma/seed.ts');
    return NextResponse.json({ success: true, message: 'Database seeded successfully', output: stdout });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
