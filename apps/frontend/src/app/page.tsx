'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { PostCard } from '@/components/post/post-card';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { FEED } from '@/graphql/posts';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Compass, Plus } from 'lucide-react';

export default function HomePage() {
  return (
    <AppShell>
      <HomeContent />
    </AppShell>
  );
}

function HomeContent() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data, loading, error, fetchMore } = useQuery(FEED, {
    variables: { limit: 10, offset: 0 },
    notifyOnNetworkStatusChange: true,
  });

  if (loading && !data)
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-lenz-border rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="h-3 bg-gray-200 rounded w-24" />
            </div>
            <div className="aspect-square bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    );

  if (error)
    return (
      <div className="text-center py-12 text-lenz-gray">
        <p>{t('common.error')}</p>
        <p className="text-xs mt-2">{error.message}</p>
      </div>
    );

  const feed = data?.feed;
  const posts = feed?.items || [];

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex w-20 h-20 rounded-full bg-gradient-to-br from-lenz-primary/10 to-lenz-secondary/10 items-center justify-center mb-6">
          <Compass className="w-10 h-10 text-lenz-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('feed.welcome')}</h2>
        <p className="text-lenz-gray mb-6 max-w-sm mx-auto">{t('feed.empty')}</p>
        <Link href="/explore">
          <Button variant="outline">
            <Compass className="w-4 h-4" />
            {t('feed.explore')}
          </Button>
        </Link>
        <Link href="/create" className="block mt-3">
          <Button variant="ghost" size="sm">
            <Plus className="w-4 h-4" />
            {t('post.create')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Stories bar */}
      <div className="bg-white border border-lenz-border rounded-xl p-4 mb-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4">
          {/* Add story */}
          <button className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="relative">
              <Avatar src={user?.avatarUrl} alt={user?.username || ''} size="lg" />
              <div className="absolute -bottom-0.5 -end-0.5 w-6 h-6 rounded-full bg-lenz-primary border-2 border-white flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <span className="text-xs text-lenz-dark truncate max-w-[64px]">
              {t('story.add')}
            </span>
          </button>
        </div>
      </div>

      {/* Posts */}
      {posts.map((post: any) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Load more */}
      {feed?.hasMore && (
        <div className="text-center py-6">
          <Button
            variant="outline"
            onClick={() =>
              fetchMore({
                variables: { offset: posts.length },
                updateQuery: (prev, { fetchMoreResult }) => {
                  if (!fetchMoreResult) return prev;
                  return {
                    feed: {
                      ...fetchMoreResult.feed,
                      items: [...prev.feed.items, ...fetchMoreResult.feed.items],
                    },
                  };
                },
              })
            }
            loading={loading}
          >
            {t('common.more')}
          </Button>
        </div>
      )}
    </div>
  );
}
