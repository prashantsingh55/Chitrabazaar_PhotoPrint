import React from 'react';
import { cn, formatDateTime } from '@/lib/utils';
import { Check, Clock, Printer, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { OrderStatus } from '@prisma/client';

export interface StatusTimelineProps {
  currentStatus: OrderStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  deliveryMethod?: 'PICKUP' | 'DELIVERY';
  cancellationReason?: string | null;
}

export function StatusTimeline({
  currentStatus,
  createdAt,
  updatedAt,
  deliveryMethod = 'PICKUP',
  cancellationReason,
}: StatusTimelineProps) {
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="rounded-[2px] border border-[#A3432B]/30 bg-[#F4F0E8] p-5">
        <div className="flex items-center gap-2 text-[#A3432B] font-serif font-medium text-base mb-1">
          <AlertCircle className="w-4 h-4" />
          Commission Voided / Cancelled
        </div>
        <p className="text-xs text-[#6B665F] font-sans">
          Docket Note: {cancellationReason || 'Commission cancelled by client or partner studio.'}
        </p>
        <p className="text-[10px] text-[#8C827A] font-mono tracking-wider mt-3 uppercase">
          Chronicle Timestamp: {formatDateTime(updatedAt)}
        </p>
      </div>
    );
  }

  const steps = [
    {
      status: 'PLACED',
      numeral: 'I',
      label: 'Commission Logged',
      description: 'Docket registered and archival print request verified',
      icon: Clock,
    },
    {
      status: 'ASSIGNED',
      numeral: 'II',
      label: 'Darkroom Assigned',
      description: 'Partner darkroom accepted production docket',
      icon: Check,
    },
    {
      status: 'PRINTING',
      numeral: 'III',
      label: 'In Darkroom / Pressing',
      description: 'Photographic plates undergoing exposure and chemical processing',
      icon: Printer,
    },
    {
      status: 'READY',
      numeral: 'IV',
      label: deliveryMethod === 'PICKUP' ? 'Ready for Studio Retrieval' : 'Dispatched for Courier Transit',
      description:
        deliveryMethod === 'PICKUP'
          ? 'Inspected, acid-free sleeved, and awaiting pickup at studio'
          : 'Enclosed in protective archival packaging and out for transit',
      icon: Package,
    },
    {
      status: 'COMPLETED',
      numeral: 'V',
      label: 'Fulfilled & Archived',
      description: 'Delivered or collected; edition archived',
      icon: CheckCircle2,
    },
  ];

  const statusOrder = ['PLACED', 'ASSIGNED', 'PRINTING', 'READY', 'COMPLETED'];
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#E8E2D8]">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8C827A]">
          Dispatch Chronicle & Progress
        </span>
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#6B665F]">
          Phase {currentIndex + 1} of 5
        </span>
      </div>

      <div className="relative pl-1">
        <div className="space-y-6">
          {steps.map((step, idx) => {
            const isDone = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isPending = idx > currentIndex;

            const Icon = step.icon;

            return (
              <div key={step.status} className="flex items-start gap-4 relative">
                {/* Hairline connector line */}
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-[13px] top-8 w-[1px] -bottom-4 z-0',
                      isDone ? 'bg-[#1A1816]' : 'bg-[#E8E2D8]'
                    )}
                  />
                )}

                {/* Step indicator */}
                <div
                  className={cn(
                    'relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-[11px] transition-all',
                    isDone && 'bg-[#1A1816] text-[#FAF8F5]',
                    isCurrent && 'bg-[#FAF8F5] border-2 border-[#1A1816] text-[#1A1816] ring-4 ring-[#F4F0E8]',
                    isPending && 'bg-[#F4F0E8] border border-[#E8E2D8] text-[#8C827A]'
                  )}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <span className="font-semibold">{step.numeral}</span>
                  )}
                </div>

                {/* Step details */}
                <div
                  className={cn(
                    'flex-1 rounded-[2px] p-4 transition-all border',
                    isCurrent && 'bg-[#FAF8F5] border-[#1A1816]/30 shadow-sm',
                    isDone && 'bg-[#F4F0E8]/40 border-[#E8E2D8]',
                    isPending && 'bg-[#FAF8F5]/30 border-transparent opacity-60'
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className={cn(
                      "font-serif text-sm font-medium",
                      isCurrent ? "text-[#1A1816]" : "text-[#3D3A36]"
                    )}>
                      {step.label}
                    </h4>
                    {isCurrent && (
                      <span className="bg-[#1A1816] text-[#FAF8F5] text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-[1px]">
                        Active Phase
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[#2D4F3E] text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
                        Recorded
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B665F] mt-1 font-sans leading-relaxed">
                    {step.description}
                  </p>
                  {idx === 0 && (
                    <span className="inline-block mt-2 text-[10px] font-mono text-[#8C827A] uppercase tracking-wider">
                      Initial Docket: {formatDateTime(createdAt)}
                    </span>
                  )}
                  {isCurrent && idx > 0 && (
                    <span className="inline-block mt-2 text-[10px] font-mono text-[#8C827A] uppercase tracking-wider">
                      Updated: {formatDateTime(updatedAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

