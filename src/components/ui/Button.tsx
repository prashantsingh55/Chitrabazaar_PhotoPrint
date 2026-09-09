'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'green'
    | 'blue'
    | 'purple'
    | 'yellow'
    | 'pink'
    | 'black'
    | 'white';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary: 'bg-[#1A1816] text-[#FAF8F5] hover:bg-[#2E2A27] border border-[#1A1816]',
      secondary: 'bg-[#FFFFFF] text-[#1A1816] border border-[#E8E2D8] hover:bg-[#F4F0E8]',
      outline: 'bg-transparent text-[#1A1816] border border-[#1A1816] hover:bg-[#1A1816] hover:text-[#FAF8F5]',
      ghost: 'bg-transparent text-[#6B655F] hover:text-[#1A1816] hover:bg-[#F4F0E8]',
      danger: 'bg-[#9E2A2B] text-white hover:bg-[#852324] border border-[#9E2A2B]',
      green: 'bg-[#2E6B38] text-white hover:bg-[#25572E] border border-[#2E6B38]',
      blue: 'bg-[#255278] text-white hover:bg-[#1E4363] border border-[#255278]',
      purple: 'bg-[#5B3E84] text-white hover:bg-[#4A326B] border border-[#5B3E84]',
      // Backward aliases mapping to editorial palette
      yellow: 'bg-[#1A1816] text-[#FAF8F5] hover:bg-[#2E2A27] border border-[#1A1816]',
      black: 'bg-[#1A1816] text-[#FAF8F5] hover:bg-[#2E2A27] border border-[#1A1816]',
      white: 'bg-[#FFFFFF] text-[#1A1816] border border-[#E8E2D8] hover:bg-[#F4F0E8]',
      pink: 'bg-[#9E2A2B] text-white hover:bg-[#852324] border border-[#9E2A2B]',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs font-medium rounded-[2px]',
      md: 'px-4 py-2 text-xs uppercase tracking-wider font-medium rounded-[2px]',
      lg: 'px-6 py-3 text-xs uppercase tracking-widest font-medium rounded-[2px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-1.5',
          'transition-all duration-150 select-none active:scale-[0.99]',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1A1816]',
          'disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
