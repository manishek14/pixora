'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { useI18n } from '@/lib/i18n';
import { EXPLORE_FEED } from '@/graphql/posts';
import { formatCount } from '@/lib/utils';
import { Heart, MessageCircle } from 'lucide-react';

export default function ExplorePage() {
  return (
    <AppShell>
      <ExploreContent />
    </AppShell>
  );
}

function ExploreContent() {
  const { t } = useI18n();
  const { data, loading } = useQuery(EXPLORE_FEED, {
    variables: { limit: 30, offset: 0 },
  });

  const posts = data?.exploreFeed?.items || [];

  return (
    <div className="px-2 lg:px-0 py-4">
      <h1 className="text-2xl font-bold mb-6 px-2">{t('feed.discover')}</h1>

      {loading ? (
        <div className="grid grid-cols-3 gap-1">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-lenz-gray py-12">{t('post.noPosts')}</p>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post: any) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="aspect-square relative group bg-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.mediaUrls?.[0] || ''}
                alt={post.caption || ''}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-semibold text-sm">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 fill-white" />
                  {formatCount(post.likesCount)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 fill-white" />
                  {formatCount(post.commentsCount)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
