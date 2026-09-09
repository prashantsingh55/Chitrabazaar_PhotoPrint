import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'neutral'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'green'
    | 'blue'
    | 'purple'
    | 'orange'
    | 'yellow'
    | 'red'
    | 'pink'
    | 'black'
    | 'white'
    | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-[#F4F0E8] text-[#1A1816] border-[#D6CEC2]',
    neutral: 'bg-[#FAF8F5] text-[#6B655F] border-[#E8E2D8]',
    outline: 'bg-transparent text-[#1A1816] border-[#1A1816]',
    success: 'bg-[#F4F8F4] text-[#2E6B38] border-[#CEE0CF]',
    warning: 'bg-[#FAF7EE] text-[#8C6D23] border-[#E8DFC2]',
    danger: 'bg-[#FAF1F1] text-[#9E2A2B] border-[#E8C7C8]',
    info: 'bg-[#F2F6F9] text-[#255278] border-[#CFDDE8]',
    green: 'bg-[#F4F8F4] text-[#2E6B38] border-[#CEE0CF]',
    blue: 'bg-[#F2F6F9] text-[#255278] border-[#CFDDE8]',
    purple: 'bg-[#F7F4FA] text-[#5B3E84] border-[#D9CDE3]',
    orange: 'bg-[#FDF6F2] text-[#9E472A] border-[#EBD5CA]',
    yellow: 'bg-[#FAF7EE] text-[#8C6D23] border-[#E8DFC2]',
    red: 'bg-[#FAF1F1] text-[#9E2A2B] border-[#E8C7C8]',
    pink: 'bg-[#FAF3F5] text-[#8C3A5A] border-[#E3CDD6]',
    black: 'bg-[#1A1816] text-[#FAF8F5] border-[#1A1816]',
    white: 'bg-white text-[#1A1816] border-[#E8E2D8]',
  };

  const sizeStyles = {
    sm: 'text-[9px] tracking-[0.14em] uppercase px-1.5 py-0.5',
    md: 'text-[10px] tracking-[0.14em] uppercase px-2 py-0.5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 font-mono font-medium border rounded-[2px] select-none leading-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
