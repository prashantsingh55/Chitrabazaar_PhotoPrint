'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-mono uppercase tracking-[0.15em] text-[#6B665F] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 bg-white/90 text-[#1A1816] text-sm font-normal rounded-[2px]',
            'border border-[#E8E2D8] placeholder:text-[#8C827A]/70',
            'focus:outline-none focus:border-[#1A1816] focus:bg-white transition-colors duration-150',
            error && 'border-[#A3432B] focus:border-[#A3432B]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs font-mono text-[#A3432B]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-mono uppercase tracking-[0.15em] text-[#6B665F] mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 bg-white/90 text-[#1A1816] text-sm font-normal rounded-[2px] cursor-pointer',
            'border border-[#E8E2D8]',
            'focus:outline-none focus:border-[#1A1816] focus:bg-white transition-colors duration-150',
            error && 'border-[#A3432B] focus:border-[#A3432B]',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1 text-xs font-mono text-[#A3432B]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-mono uppercase tracking-[0.15em] text-[#6B665F] mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 bg-white/90 text-[#1A1816] text-sm font-normal rounded-[2px]',
            'border border-[#E8E2D8] placeholder:text-[#8C827A]/70',
            'focus:outline-none focus:border-[#1A1816] focus:bg-white transition-colors duration-150',
            error && 'border-[#A3432B] focus:border-[#A3432B]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs font-mono text-[#A3432B]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
