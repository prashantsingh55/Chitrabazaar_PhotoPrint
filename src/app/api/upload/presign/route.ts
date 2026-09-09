import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPresignedUploadUrl } from '@/modules/storage/r2';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Presigned upload is permitted for authenticated users or prospective customers composing an order
    const body = await req.json();
    const { filename, mimeType, sizeBytes } = body;

    if (!filename || !mimeType) {
      return NextResponse.json(
        { error: 'Filename and mimeType are required' },
        { status: 400 }
      );
    }

    const presignedData = await createPresignedUploadUrl(
      filename,
      mimeType,
      sizeBytes ? Number(sizeBytes) : undefined
    );

    return NextResponse.json({
      success: true,
      ...presignedData,
      userId: session?.user?.id || 'guest',
    });
  } catch (error) {
    console.error('Failed to generate presigned upload URL:', error);
    const msg = error instanceof Error ? error.message : 'Failed to generate upload URL';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
