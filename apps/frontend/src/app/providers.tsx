'use client';

import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
