'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { AppShell } from '@/components/layout/app-shell';
import { useI18n } from '@/lib/i18n';
import { POSTS_BY_HASHTAG } from '@/graphql/posts';
import { formatCount } from '@/lib/utils';
import { Heart, MessageCircle, Hash } from 'lucide-react';

export default function HashtagPage() {
  return (
    <AppShell>
      <HashtagContent />
    </AppShell>
  );
}

function HashtagContent() {
  const params = useParams<{ tag: string }>();
  const tag = params?.tag as string;
  const { t } = useI18n();

  const { data, loading } = useQuery(POSTS_BY_HASHTAG, { variables: { tag } });
  const posts = data?.postsByHashtag || [];

  return (
    <div className="py-4 px-2">
      <header className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-lenz-primary/10 to-lenz-secondary/10 mb-3">
          <Hash className="w-8 h-8 text-lenz-primary" />
        </div>
        <h1 className="text-2xl font-bold">#{tag}</h1>
        <p className="text-sm text-lenz-gray mt-1">
          {formatCount(posts.length)} {t('profile.posts')}
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-3 gap-1">
          {[...Array(9)].map((_, i) => (
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
