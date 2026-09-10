import { NextRequest, NextResponse } from 'next/server';
import { createPresignedDownloadUrl, isR2Configured, normalizeAssetKey } from '@/modules/storage/r2';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    if (!params.key || params.key.length === 0) {
      return NextResponse.json({ error: 'Asset key required' }, { status: 400 });
    }

    // Join catch-all route segments and decode
    const rawAssetKey = params.key.map((k) => decodeURIComponent(k)).join('/');
    const cleanKey = normalizeAssetKey(rawAssetKey);

    const { searchParams } = new URL(req.url);
    const isDownload =
      searchParams.get('download') === '1' ||
      searchParams.get('download') === 'true';
    const customFilename =
      searchParams.get('filename') ||
      cleanKey.split('/').pop() ||
      'photo.jpg';

    // 1. Cloudflare R2 / S3 mode: redirect directly to presigned URL (0-RAM, 0-egress cost)
    if (isR2Configured) {
      const presignedUrl = await createPresignedDownloadUrl(
        cleanKey,
        900,
        isDownload ? customFilename : undefined
      );

      return NextResponse.redirect(presignedUrl, {
        status: 307,
        headers: {
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // 2. Local Fallback mode: serve from public/ directory
    const publicPath = path.join(process.cwd(), 'public', cleanKey);
    let filePath = publicPath;

    if (!fs.existsSync(filePath)) {
      // Try fallback to uploads folder
      const uploadsPath = path.join(
        process.cwd(),
        'public',
        'uploads',
        cleanKey.split('/').pop() || ''
      );
      if (fs.existsSync(uploadsPath)) {
        filePath = uploadsPath;
      } else {
        return NextResponse.json({ error: 'Asset not found on disk' }, { status: 404 });
      }
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400',
    };

    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="${customFilename.replace(/["\r\n]/g, '_')}"`;
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Failed to resolve asset:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve requested asset' },
      { status: 500 }
    );
  }
}
