'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/app-shell';
import { useI18n } from '@/lib/i18n';
import { SEARCH_USERS } from '@/graphql/auth';
import { Avatar } from '@/components/ui/avatar';
import { Search, X, Verified as VerifiedIcon } from 'lucide-react';

export default function SearchPage() {
  return (
    <AppShell>
      <SearchContent />
    </AppShell>
  );
}

function SearchContent() {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const { data, loading } = useQuery(SEARCH_USERS, {
    variables: { q, limit: 30 },
    skip: q.trim().length < 2,
  });

  const users = data?.searchUsers || [];

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-4 px-2">{t('nav.search')}</h1>

      <div className="relative mb-6 px-2">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-lenz-gray" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search.placeholder')}
          className="w-full h-11 ps-11 pe-10 rounded-lg bg-gray-100 text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-lenz-border"
          autoFocus
        />
        {q && (
          <button
            onClick={() => setQ('')}
            className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-lenz-gray hover:text-lenz-dark"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {q.trim().length < 2 ? (
        <p className="text-center text-lenz-gray py-12 text-sm">
          {t('search.placeholder')}
        </p>
      ) : loading ? (
        <div className="space-y-2 px-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="text-center text-lenz-gray py-12 text-sm">
          {t('search.noResults')}
        </p>
      ) : (
        <ul className="divide-y divide-lenz-border">
          {users.map((u: any) => (
            <li key={u.id}>
              <Link
                href={`/profile/${u.username}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
              >
                <Avatar src={u.avatarUrl} alt={u.username} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm truncate">{u.username}</span>
                    {u.isVerified && (
                      <VerifiedIcon className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-lenz-gray truncate">
                    {u.fullName || u.username}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
