import sharp from 'sharp';
import prisma from '@/lib/prisma';
import { PrintJobStatus, PrintSize } from '@prisma/client';
import { getAssetBuffer, uploadProcessedAsset } from '@/modules/storage/r2';
import { calculatePreflightMetrics, PRINT_SPECS } from '@/modules/print-jobs';
import { MediaProcessingPayload } from '@/lib/queue';

/**
 * Executes the Sharp SIMD media preflight and 300 DPI darkroom master generation pipeline.
 */
export async function processMediaJob(job: { data: MediaProcessingPayload }) {
  const {
    printJobId,
    orderId,
    rawAssetKey,
    targetSize,
    cropRotation = 0,
  } = job.data;

  console.log(`[Media Worker] Preflighting PrintJob ${printJobId} (${targetSize}) for Order ${orderId}`);

  // 1. Update status to PREFLIGHTING
  await prisma.printJob.update({
    where: { id: printJobId },
    data: { status: PrintJobStatus.PREFLIGHTING },
  });

  // 2. Fetch raw image buffer from Cloudflare R2
  const rawBuffer = await getAssetBuffer(rawAssetKey);

  // 3. Inspect metadata using Sharp
  const metadata = await sharp(rawBuffer).metadata();
  const rawWidth = metadata.width || 1000;
  const rawHeight = metadata.height || 1000;
  const exifOrientation = metadata.orientation || 1;

  // 4. Calculate preflight metrics & print density
  const validSize = (targetSize in PRINT_SPECS ? targetSize : 'SIZE_4X6') as PrintSize;
  const { detectedDpi, aspectRatioMatch, warnings } = calculatePreflightMetrics(
    rawWidth,
    rawHeight,
    validSize
  );

  const spec = PRINT_SPECS[validSize];

  // 5. Build 300 DPI Master Print Plate
  // Normalize EXIF orientation, apply manual crop rotation, resize to target press dimensions
  let pipeline = sharp(rawBuffer)
    .rotate() // Auto-orient via EXIF
    .withMetadata({ density: 300 });

  if (cropRotation) {
    pipeline = pipeline.rotate(cropRotation);
  }

  // Determine landscape vs portrait target
  const isTargetLandscape = spec.widthInches > spec.heightInches;
  const isImageLandscape = rawWidth > rawHeight;
  const targetW = isImageLandscape ? Math.max(spec.targetWidthPx, spec.targetHeightPx) : Math.min(spec.targetWidthPx, spec.targetHeightPx);
  const targetH = isImageLandscape ? Math.min(spec.targetWidthPx, spec.targetHeightPx) : Math.max(spec.targetWidthPx, spec.targetHeightPx);

  const masterBuffer = await pipeline
    .resize(targetW, targetH, {
      fit: 'cover',
      position: 'centre',
    })
    .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
    .toBuffer();

  const masterAssetKey = `masters/${orderId}/${printJobId}-300dpi.jpg`;
  await uploadProcessedAsset(masterAssetKey, masterBuffer, 'image/jpeg');

  // 6. Generate lightweight WebP customer proof (800px max)
  const proofBuffer = await sharp(rawBuffer)
    .rotate()
    .resize(800, 800, { fit: 'inside' })
    .webp({ quality: 85 })
    .toBuffer();

  const proofAssetKey = `proofs/${orderId}/${printJobId}-proof.webp`;
  await uploadProcessedAsset(proofAssetKey, proofBuffer, 'image/webp');

  // 7. Update PrintJob record in Neon DB
  const updatedJob = await prisma.printJob.update({
    where: { id: printJobId },
    data: {
      status: PrintJobStatus.READY_FOR_PRESS,
      masterAssetKey,
      proofAssetKey,
      detectedDpi,
      exifOrientation,
      aspectRatioMatch,
      preflightWarnings: warnings,
    },
  });

  console.log(
    `[Media Worker] PrintJob ${printJobId} ready for press. Detected DPI: ${detectedDpi}, Warnings: ${warnings.length}`
  );

  return updatedJob;
}
