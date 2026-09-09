import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = '$'): string {
  const symbol = currency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || '$';
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function generateOrderNumber(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `CB-${randomNum}`;
}

export const PRINT_SIZE_LABELS: Record<string, string> = {
  SIZE_4X6: '4" × 6" (Standard Carte-de-Visite)',
  SIZE_5X7: '5" × 7" (Cabinet Print)',
  SIZE_A4: 'A4 Folio (8.3" × 11.7")',
  SIZE_PASSPORT: 'Passport Sheet (8 Archival Cuts)',
  SIZE_8X10: '8" × 10" (Gallery Portrait)',
  SIZE_12X18: '12" × 18" (Exhibition Broadside)',
};

export const PRINT_SIZE_PRICES: Record<string, number> = {
  SIZE_4X6: 1.20,
  SIZE_5X7: 3.50,
  SIZE_A4: 5.00,
  SIZE_PASSPORT: 4.50,
  SIZE_8X10: 8.00,
  SIZE_12X18: 16.00,
};

export const PAPER_TYPE_SURCHARGES: Record<string, number> = {
  GLOSSY: 0.0,
  MATTE: 0.5,
  LUSTRE: 0.8,
};

export function getPrintSizeLabel(size: string): string {
  return PRINT_SIZE_LABELS[size] || size.replace('SIZE_', '').replace('_', ' × ');
}

export function getStatusColor(status: string): { bg: string; text: string; label: string; border: string } {
  switch (status) {
    case 'PLACED':
      return {
        bg: 'bg-[#FAF7EE]',
        text: 'text-[#8C6D23]',
        border: 'border-[#E8DFC2]',
        label: 'Commission Logged',
      };
    case 'ASSIGNED':
      return {
        bg: 'bg-[#F2F6F9]',
        text: 'text-[#255278]',
        border: 'border-[#CFDDE8]',
        label: 'Studio Assigned',
      };
    case 'PRINTING':
      return {
        bg: 'bg-[#FDF6F2]',
        text: 'text-[#9E472A]',
        border: 'border-[#EBD5CA]',
        label: 'In Darkroom / Pressing',
      };
    case 'READY':
      return {
        bg: 'bg-[#F4F8F4]',
        text: 'text-[#2E6B38]',
        border: 'border-[#CEE0CF]',
        label: 'Ready for Collection',
      };
    case 'COMPLETED':
      return {
        bg: 'bg-[#1A1816]',
        text: 'text-[#FAF8F5]',
        border: 'border-[#1A1816]',
        label: 'Fulfilled & Archived',
      };
    case 'CANCELLED':
      return {
        bg: 'bg-[#FAF1F1]',
        text: 'text-[#9E2A2B]',
        border: 'border-[#E8C7C8]',
        label: 'Voided',
      };
    default:
      return {
        bg: 'bg-[#F4F0E8]',
        text: 'text-[#57534E]',
        border: 'border-[#E8E2D8]',
        label: status,
      };
  }
}
