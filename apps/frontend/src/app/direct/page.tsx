'use client';

import { AppShell } from '@/components/layout/app-shell';
import { useI18n } from '@/lib/i18n';
import { MessageCircle } from 'lucide-react';

export default function DirectPage() {
  return (
    <AppShell>
      <DirectContent />
    </AppShell>
  );
}

function DirectContent() {
  const { t } = useI18n();

  // Direct/Chat feature will be implemented in Phase 4 with Socket.io
  return (
    <div className="py-16 px-4 text-center">
      <div className="inline-flex w-20 h-20 rounded-full bg-gradient-to-br from-lenz-primary/10 to-lenz-secondary/10 items-center justify-center mb-6">
        <MessageCircle className="w-10 h-10 text-lenz-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{t('direct.title')}</h2>
      <p className="text-lenz-gray mb-1">{t('direct.empty')}</p>
      <p className="text-sm text-lenz-gray max-w-sm mx-auto">
        {t('direct.empty.desc')}
      </p>
      <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lenz-primary/10 text-lenz-primary text-sm">
        <span className="w-2 h-2 rounded-full bg-lenz-primary animate-pulse" />
        Phase 4 — Coming soon (Socket.io realtime)
      </div>
    </div>
  );
}
