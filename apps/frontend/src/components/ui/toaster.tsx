'use client';

import { useToasts, toast, type ToastVariant } from '@/lib/toast-store';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
};

const ACCENT: Record<ToastVariant, string> = {
  error: 'text-rose-400',
  success: 'text-emerald-400',
  info: 'text-sky-400',
  warning: 'text-amber-400',
};

export function Toaster() {
  const items = useToasts();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3"
    >
      {items.map((t) => {
        const Icon = ICONS[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              // liquid glass surface
              'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl p-3.5',
              'glass-card glass-card--raised',
              'border border-white/15 dark:border-white/10',
              'shadow-[0_8px_32px_rgba(0,0,0,0.18)]',
              // entrance animation
              'animate-[toast-in_220ms_cubic-bezier(0.16,1,0.3,1)]',
            )}
            style={{ backdropFilter: 'blur(20px) saturate(160%)' }}
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', ACCENT[t.variant])} />
            <p className="flex-1 text-sm leading-relaxed text-zinc-100 dark:text-zinc-50">
              {t.message}
            </p>
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="-m-1 rounded-md p-1 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
              aria-label="بستن"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
