'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Mode = 'dark' | 'light' | 'system';

const MODES: Array<{ value: Mode; Icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'dark', Icon: Moon },
  { value: 'light', Icon: Sun },
  { value: 'system', Icon: Monitor },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  // next-themes is no-flash-safe but the value is only known on the client.
  // Render a stable placeholder until mounted to avoid hydration mismatch.
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  const active = (theme as Mode) || 'dark';

  if (compact) {
    // Single-button toggle — rotates through dark → light → system → dark
    const ActiveIcon = MODES.find((m) => m.value === active)?.Icon || Moon;
    const next: Mode = active === 'dark' ? 'light' : active === 'light' ? 'system' : 'dark';
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={t('theme.toggle')}
        title={t(`theme.${active}`)}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-lenz-gray transition hover:bg-white/10 hover:text-lenz-dark"
      >
        <ActiveIcon className="h-5 w-5" />
      </button>
    );
  }

  // Segmented toggle — three pills in a glass container
  return (
    <div
      role="radiogroup"
      aria-label={t('theme.toggle')}
      className="glass-card--subtle flex items-center gap-1 rounded-xl p-1"
    >
      {MODES.map(({ value, Icon }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(value)}
            title={t(`theme.${value}`)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg transition',
              isActive
                ? 'bg-lenz-primary/20 text-lenz-primary'
                : 'text-lenz-gray hover:text-lenz-dark hover:bg-white/5',
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
