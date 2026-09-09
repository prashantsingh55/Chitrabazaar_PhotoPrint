'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1816]/50 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative w-full bg-[#FAF8F5] border border-[#E8E2D8] rounded-[2px] shadow-2xl z-10 overflow-hidden',
          'transform transition-all',
          maxWidthStyles[maxWidth]
        )}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D8] bg-[#F4F0E8]/60">
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#8C827A] mb-0.5">
              Edition Dialog
            </span>
            <h3 className="font-serif text-lg font-medium text-[#1A1816] tracking-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[2px] text-[#8C827A] hover:text-[#1A1816] hover:bg-[#E8E2D8]/50 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto bg-[#FAF8F5]">
          {children}
        </div>
      </div>
    </div>
  );
}

