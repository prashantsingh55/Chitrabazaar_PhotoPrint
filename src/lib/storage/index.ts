import fs from 'fs';
import path from 'path';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/tiff',
];

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export function validateImageFile(file: { type: string; size: number }): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file format "${file.type}". Allowed types: JPG, PNG, WEBP, HEIC, TIFF.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds 20MB limit (size: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  return { valid: true };
}

export async function uploadFile(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<UploadResult> {
  const provider = process.env.STORAGE_PROVIDER || 'local';

  // If R2 or S3 is configured, stream buffer directly to Cloudflare R2
  if (provider === 's3' || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY) {
    try {
      const { uploadProcessedAsset } = await import('@/modules/storage/r2');
      const extension = path.extname(originalFilename) || '.jpg';
      const cleanName = path.basename(originalFilename, extension).replace(/[^a-zA-Z0-9_-]/g, '_');
      const datePrefix = new Date().toISOString().slice(0, 10);
      const uniqueKey = `raw/${datePrefix}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${cleanName}${extension}`;

      const uploadedUrl = await uploadProcessedAsset(uniqueKey, buffer, mimeType);

      return {
        url: uploadedUrl || uniqueKey,
        filename: originalFilename,
        size: buffer.length,
        mimeType,
      };
    } catch (r2Err) {
      console.warn('Direct cloud storage upload failed, attempting local fallback:', r2Err);
    }
  }

  // Local/Direct storage for seamless development and testing
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const extension = path.extname(originalFilename) || '.jpg';
  const cleanName = path.basename(originalFilename, extension).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueName = `${cleanName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${extension}`;
  const filePath = path.join(uploadsDir, uniqueName);

  fs.writeFileSync(filePath, buffer);

  return {
    url: `/uploads/${uniqueName}`,
    filename: originalFilename,
    size: buffer.length,
    mimeType,
  };
}
