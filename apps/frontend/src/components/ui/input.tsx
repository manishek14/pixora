'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Optional icon rendered before the input content */
  leadingIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, leadingIcon, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-lenz-dark"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-lenz-gray">
              {leadingIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'glass-input h-11 w-full px-3.5 text-sm',
              leadingIcon && 'ps-10',
              error && '!border-rose-500/70 !bg-rose-500/5',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-lenz-dark"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'glass-input w-full resize-none px-3.5 py-2.5 text-sm',
            error && '!border-rose-500/70 !bg-rose-500/5',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
