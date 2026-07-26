'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, fullWidth, children, disabled, ...props },
    ref,
  ) => {
    const variants: Record<string, string> = {
      primary: 'glass-btn-primary',
      secondary: 'glass-btn-ghost',
      outline: 'glass-btn-ghost',
      ghost: 'text-lenz-dark/80 hover:bg-white/10 rounded-lg',
      danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_6px_18px_rgba(244,63,94,0.35)]',
    };
    const sizes: Record<string, string> = {
      sm: 'h-9 px-3.5 text-sm',
      md: 'h-11 px-5 text-sm',
      lg: 'h-12 px-6 text-base',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lenz-primary/50 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
