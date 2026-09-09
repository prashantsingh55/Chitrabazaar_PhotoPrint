import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'subtle' | 'dark' | 'yellow' | 'pink' | 'blue' | 'cream';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  bordered?: boolean;
}

export function Card({
  className,
  variant = 'white',
  shadow = 'none',
  bordered = true,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    white: 'bg-[#FFFFFF] text-[#1A1816]',
    subtle: 'bg-[#F4F0E8] text-[#1A1816]',
    dark: 'bg-[#1A1816] text-[#FAF8F5] border-[#2D2A26]',
    yellow: 'bg-[#FAF7EE] text-[#1A1816] border-[#E8DFC2]',
    pink: 'bg-[#FAF1F1] text-[#1A1816] border-[#E8C7C8]',
    blue: 'bg-[#F2F6F9] text-[#1A1816] border-[#CFDDE8]',
    cream: 'bg-[#FAF8F5] text-[#1A1816] border-[#E8E2D8]',
  };

  const shadowStyles = {
    none: 'shadow-none',
    sm: 'shadow-[0_1px_3px_rgba(26,24,22,0.04)]',
    md: 'shadow-[0_4px_12px_rgba(26,24,22,0.06)]',
    lg: 'shadow-[0_8px_20px_rgba(26,24,22,0.08)]',
    xl: 'shadow-[0_12px_28px_rgba(26,24,22,0.1)]',
  };

  return (
    <div
      className={cn(
        'rounded-[2px] p-5 sm:p-6 transition-all duration-150',
        bordered && 'border border-[#E8E2D8]',
        variantStyles[variant],
        shadowStyles[shadow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
