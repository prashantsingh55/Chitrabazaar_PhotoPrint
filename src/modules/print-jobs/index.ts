import prisma from '@/lib/prisma';
import { PrintJobStatus, PrintSize } from '@prisma/client';

export interface PrintSizeSpec {
  widthInches: number;
  heightInches: number;
  targetWidthPx: number;
  targetHeightPx: number;
  aspectRatio: number;
}

export const PRINT_SPECS: Record<PrintSize, PrintSizeSpec> = {
  SIZE_4X6: {
    widthInches: 4,
    heightInches: 6,
    targetWidthPx: 1200,
    targetHeightPx: 1800,
    aspectRatio: 2 / 3,
  },
  SIZE_5X7: {
    widthInches: 5,
    heightInches: 7,
    targetWidthPx: 1500,
    targetHeightPx: 2100,
    aspectRatio: 5 / 7,
  },
  SIZE_A4: {
    widthInches: 8.27,
    heightInches: 11.69,
    targetWidthPx: 2480,
    targetHeightPx: 3508,
    aspectRatio: 1 / 1.414,
  },
  SIZE_PASSPORT: {
    widthInches: 2,
    heightInches: 2,
    targetWidthPx: 600,
    targetHeightPx: 600,
    aspectRatio: 1,
  },
  SIZE_8X10: {
    widthInches: 8,
    heightInches: 10,
    targetWidthPx: 2400,
    targetHeightPx: 3000,
    aspectRatio: 4 / 5,
  },
  SIZE_12X18: {
    widthInches: 12,
    heightInches: 18,
    targetWidthPx: 3600,
    targetHeightPx: 5400,
    aspectRatio: 2 / 3,
  },
};

/**
 * Generates an archival darkroom docket number e.g. "JOB-CB-84920-01"
 */
export function generateJobDocketNumber(orderNumber: string, itemIndex: number): string {
  const paddedIndex = String(itemIndex + 1).padStart(2, '0');
  return `JOB-${orderNumber}-${paddedIndex}`;
}

/**
 * Calculates preflight specs and DPI for an image of given dimensions against print format.
 */
export function calculatePreflightMetrics(
  widthPx: number,
  heightPx: number,
  format: PrintSize
): {
  detectedDpi: number;
  isHighResolution: boolean;
  aspectRatioMatch: boolean;
  warnings: string[];
} {
  const spec = PRINT_SPECS[format] || PRINT_SPECS.SIZE_4X6;
  const warnings: string[] = [];

  // Determine orientation
  const isTargetLandscape = spec.widthInches > spec.heightInches;
  const isImageLandscape = widthPx > heightPx;

  const longPx = Math.max(widthPx, heightPx);
  const shortPx = Math.min(widthPx, heightPx);
  const longInches = Math.max(spec.widthInches, spec.heightInches);
  const shortInches = Math.min(spec.widthInches, spec.heightInches);

  const dpiWidth = shortPx / shortInches;
  const dpiHeight = longPx / longInches;
  const detectedDpi = Math.round(Math.min(dpiWidth, dpiHeight));

  if (detectedDpi < 150) {
    warnings.push(`Low DPI detected (${detectedDpi} DPI). Recommended: 300 DPI for darkroom quality.`);
  } else if (detectedDpi < 240) {
    warnings.push(`Acceptable DPI (${detectedDpi} DPI), but slight softness may be visible.`);
  }

  // Aspect ratio check
  const imageAspect = shortPx / longPx;
  const specAspect = shortInches / longInches;
  const aspectDiff = Math.abs(imageAspect - specAspect);
  const aspectRatioMatch = aspectDiff < 0.05;

  if (!aspectRatioMatch) {
    warnings.push(`Image aspect ratio does not perfectly match selected print format. Safe-crop applied.`);
  }

  return {
    detectedDpi,
    isHighResolution: detectedDpi >= 240,
    aspectRatioMatch,
    warnings,
  };
}

/**
 * Transition a PrintJob status.
 */
export async function updatePrintJobStatus(
  printJobId: string,
  newStatus: PrintJobStatus,
  extraData?: {
    masterAssetKey?: string;
    proofAssetKey?: string;
    detectedDpi?: number;
    preflightWarnings?: string[];
  }
) {
  return await prisma.printJob.update({
    where: { id: printJobId },
    data: {
      status: newStatus,
      ...(extraData?.masterAssetKey && { masterAssetKey: extraData.masterAssetKey }),
      ...(extraData?.proofAssetKey && { proofAssetKey: extraData.proofAssetKey }),
      ...(extraData?.detectedDpi !== undefined && { detectedDpi: extraData.detectedDpi }),
      ...(extraData?.preflightWarnings && { preflightWarnings: extraData.preflightWarnings }),
    },
  });
}
