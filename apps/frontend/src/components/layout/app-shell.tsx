'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar, MobileNav } from '@/components/layout/sidebar';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { Camera } from 'lucide-react';

// Public routes that don't need auth or AppShell chrome
const PUBLIC_ROUTES = new Set(['/login', '/register']);

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  // Don't redirect on public routes
  useEffect(() => {
    if (!loading && !isAuthenticated && !isPublicRoute) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, isPublicRoute, router]);

  // Loading state
  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_8px_24px_rgba(42,171,238,0.45)]"
            style={{ background: 'linear-gradient(135deg, #2AABEE 0%, #4FC3F7 100%)' }}
          >
            <Camera className="h-7 w-7 animate-pulse text-white" />
          </div>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-[loading-bar_1.2s_ease-in-out_infinite] rounded-full bg-lenz-primary" />
          </div>
        </div>
        <style>{`
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  // Not authenticated → render children bare (the redirect will fire)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // On public routes while authenticated (e.g. user hits /login while logged in),
  // still render the bare children so the page itself can redirect.
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Authenticated app — full shell
  return (
    <div className="relative min-h-screen">
      <Sidebar />
      <main
        className={cn(
          'relative z-10 min-h-screen pb-24 lg:pb-0',
          locale === 'fa' ? 'lg:mr-72' : 'lg:ml-72',
        )}
      >
        <div className="mx-auto max-w-2xl lg:px-6 lg:py-8">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
