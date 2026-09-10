import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID =
  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
  process.env.S3_ACCESS_KEY ||
  process.env.S3_ACCESS_KEY_ID ||
  process.env.AWS_ACCESS_KEY_ID ||
  '';
const R2_SECRET_ACCESS_KEY =
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
  process.env.S3_SECRET_KEY ||
  process.env.S3_SECRET_ACCESS_KEY ||
  process.env.AWS_SECRET_ACCESS_KEY ||
  '';
const R2_BUCKET_NAME =
  process.env.CLOUDFLARE_R2_BUCKET_NAME ||
  process.env.S3_BUCKET ||
  process.env.S3_BUCKET_NAME ||
  process.env.AWS_BUCKET_NAME ||
  'chitrabazaar-media';
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.NEXT_PUBLIC_MEDIA_URL || '';

// Compute Cloudflare R2 endpoint URL
const R2_ENDPOINT =
  process.env.CLOUDFLARE_R2_ENDPOINT ||
  process.env.S3_ENDPOINT ||
  (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

export const isR2Configured = Boolean(
  R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && (R2_ENDPOINT || process.env.AWS_REGION)
);

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || 'mock-access-key',
    secretAccessKey: R2_SECRET_ACCESS_KEY || 'mock-secret-key',
  },
  forcePathStyle: true,
});

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/tiff',
];

export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB raw digital camera plate

export interface PresignedUploadResponse {
  uploadUrl: string;
  assetKey: string;
  publicUrl: string;
  expiresInSeconds: number;
}

/**
 * Generates a short-lived (15 min) presigned PUT URL allowing the client browser
 * to stream raw photos directly to Cloudflare R2, bypassing web server RAM.
 */
export async function createPresignedUploadUrl(
  filename: string,
  mimeType: string,
  sizeBytes?: number
): Promise<PresignedUploadResponse> {
  const normalizedType = mimeType.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(normalizedType)) {
    throw new Error(
      `Unsupported file type: ${mimeType}. Allowed formats: JPG, PNG, WEBP, HEIC, TIFF`
    );
  }

  if (sizeBytes && sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(
      `File size ${(sizeBytes / (1024 * 1024)).toFixed(1)}MB exceeds maximum 50MB per photograph`
    );
  }

  const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const datePrefix = new Date().toISOString().slice(0, 10);
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const assetKey = `raw/${datePrefix}/${Date.now()}-${randomSuffix}-${cleanFilename}`;

  // If R2 credentials are not configured, provide a fallback endpoint for local dev
  if (!isR2Configured) {
    return {
      uploadUrl: `/api/upload?key=${encodeURIComponent(assetKey)}`,
      assetKey,
      publicUrl: `/uploads/${cleanFilename}`,
      expiresInSeconds: 900,
    };
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: assetKey,
    ContentType: normalizedType,
  });

  const expiresInSeconds = 900; // 15 minutes TTL
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });

  const publicUrl = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${assetKey}`
    : uploadUrl.split('?')[0];

  return {
    uploadUrl,
    assetKey,
    publicUrl,
    expiresInSeconds,
  };
}

/**
 * Generates a short-lived (15 min) presigned GET URL for authorized photo studio technicians
 * to securely download raw or 300 DPI master plates without exposing bucket credentials.
 */
/**
 * Normalizes an asset key, stripping protocol, hostname, or bucket prefix if a full URL was provided.
 */
export function normalizeAssetKey(keyOrUrl: string): string {
  if (!keyOrUrl) return '';
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    try {
      const url = new URL(keyOrUrl);
      let pathname = url.pathname.replace(/^\/+/, '');
      if (R2_BUCKET_NAME && pathname.startsWith(`${R2_BUCKET_NAME}/`)) {
        pathname = pathname.slice(R2_BUCKET_NAME.length + 1);
      }
      return pathname;
    } catch {
      return keyOrUrl;
    }
  }
  return keyOrUrl.replace(/^\/+/, '');
}

export async function createPresignedDownloadUrl(
  assetKey: string,
  expiresInSeconds: number = 900,
  downloadFilename?: string
): Promise<string> {
  const normalizedKey = normalizeAssetKey(assetKey);
  if (!isR2Configured) {
    // Local development fallback
    const localTarget = normalizedKey.startsWith('/') ? normalizedKey : `/uploads/${normalizedKey.split('/').pop()}`;
    return downloadFilename ? `${localTarget}?filename=${encodeURIComponent(downloadFilename)}` : localTarget;
  }

  const cleanFilename = downloadFilename ? downloadFilename.replace(/["\r\n]/g, '_') : undefined;

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: normalizedKey,
    ResponseContentDisposition: cleanFilename
      ? `attachment; filename="${cleanFilename}"`
      : undefined,
  });

  return await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Fetches an object buffer from Cloudflare R2 (used by the background media worker).
 */
export async function getAssetBuffer(assetKey: string): Promise<Buffer> {
  const normalizedKey = normalizeAssetKey(assetKey);
  if (!isR2Configured) {
    // Local fallback: read from public/uploads
    const fs = await import('fs');
    const path = await import('path');
    const localPath = path.join(process.cwd(), 'public', normalizedKey.startsWith('/') ? normalizedKey.slice(1) : normalizedKey);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
    // Check uploads directly
    const fallbackPath = path.join(process.cwd(), 'public', 'uploads', normalizedKey.split('/').pop() || '');
    if (fs.existsSync(fallbackPath)) {
      return fs.readFileSync(fallbackPath);
    }
    throw new Error(`Local file not found for asset key: ${normalizedKey}`);
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: normalizedKey,
  });

  const response = await r2Client.send(command);
  const stream = response.Body;
  if (!stream) {
    throw new Error(`Empty response body from R2 for asset: ${assetKey}`);
  }

  const chunks: Uint8Array[] = [];
  // @ts-ignore stream is an AsyncIterable
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Uploads a processed asset (e.g. 300 DPI press master or WebP proof) to Cloudflare R2.
 */
export async function uploadProcessedAsset(
  assetKey: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (!isR2Configured) {
    // Local fallback: write to public/uploads
    const fs = await import('fs');
    const path = await import('path');
    const localDir = path.join(process.cwd(), 'public', path.dirname(assetKey));
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localPath = path.join(process.cwd(), 'public', assetKey);
    fs.writeFileSync(localPath, buffer);
    return `/${assetKey}`;
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: assetKey,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);

  return R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${assetKey}`
    : `https://${R2_BUCKET_NAME}.r2.cloudflarestorage.com/${assetKey}`;
}

/**
 * Deletes an asset from Cloudflare R2.
 */
export async function deleteAsset(assetKey: string): Promise<void> {
  if (!isR2Configured) return;

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: assetKey,
  });

  await r2Client.send(command);
}

/**
 * Health check probe for Cloudflare R2 connectivity.
 */
export async function checkR2Health(): Promise<{ ok: boolean; message?: string }> {
  if (!isR2Configured) {
    return { ok: true, message: 'Local storage fallback active (R2 unconfigured)' };
  }

  try {
    const command = new HeadBucketCommand({
      Bucket: R2_BUCKET_NAME,
    });
    await r2Client.send(command);
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, message: msg };
  }
}
