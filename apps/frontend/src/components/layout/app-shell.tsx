'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar, MobileNav } from '@/components/layout/sidebar';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { locale } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lenz-bg">
        <div className="w-12 h-12 rounded-full border-4 border-lenz-primary/30 border-t-lenz-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lenz-bg">
        <div className="w-12 h-12 rounded-full border-4 border-lenz-primary/30 border-t-lenz-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lenz-bg">
      <Sidebar />
      <main
        className={cn(
          'min-h-screen pb-20 lg:pb-0',
          locale === 'fa' ? 'lg:mr-64' : 'lg:ml-64',
        )}
      >
        <div className="max-w-2xl mx-auto lg:px-6 lg:py-8">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
