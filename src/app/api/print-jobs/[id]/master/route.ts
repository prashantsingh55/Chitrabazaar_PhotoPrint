import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createPresignedDownloadUrl } from '@/modules/storage/r2';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, studioId } = session.user;
    const printJobId = params.id;

    const printJob = await prisma.printJob.findUnique({
      where: { id: printJobId },
      include: { order: true },
    });

    if (!printJob) {
      return NextResponse.json({ error: 'Print job not found' }, { status: 404 });
    }

    // Access control: only assigned studio or super admin
    if (role === 'STUDIO_ADMIN' && printJob.studioId !== studioId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const assetKeyToDownload = printJob.masterAssetKey || printJob.rawAssetKey;
    const presignedDownloadUrl = await createPresignedDownloadUrl(assetKeyToDownload, 900);

    return NextResponse.json({
      success: true,
      downloadUrl: presignedDownloadUrl,
      docketNumber: printJob.jobDocketNumber,
      isMaster: Boolean(printJob.masterAssetKey),
      expiresInSeconds: 900,
    });
  } catch (error) {
    console.error('Failed to issue master download URL:', error);
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
  }
}
