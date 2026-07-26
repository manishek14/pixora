'use client';

import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hasStory?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Avatar({ src, alt, size = 'md', hasStory, className, onClick }: AvatarProps) {
  const sizes: Record<string, string> = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const Inner = (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-700 to-slate-800',
        sizes[size],
        !src && 'text-lenz-gray',
      )}
      onClick={onClick}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-semibold uppercase text-zinc-300">
          {alt.slice(0, 1)}
        </span>
      )}
    </div>
  );

  if (hasStory) {
    return (
      <div className={cn('story-ring cursor-pointer', className)} onClick={onClick}>
        <div className="story-ring-inner">{Inner}</div>
      </div>
    );
  }

  return <div className={cn(className, onClick && 'cursor-pointer')}>{Inner}</div>;
}
