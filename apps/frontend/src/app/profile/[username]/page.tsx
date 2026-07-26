'use client';

import { useQuery, useMutation } from '@apollo/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import {
  USER_BY_USERNAME,
  SEARCH_USERS,
} from '@/graphql/auth';
import { POSTS_BY_USER } from '@/graphql/posts';
import { FOLLOW_USER, UNFOLLOW_USER, IS_FOLLOWING } from '@/graphql/follows';
import { formatCount } from '@/lib/utils';
import {
  Settings,
  Grid3x3,
  Film,
  Bookmark,
  Verified as VerifiedIcon,
  Link as LinkIcon,
  MessageCircle,
} from 'lucide-react';

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileContent />
    </AppShell>
  );
}

function ProfileContent() {
  const params = useParams<{ username: string }>();
  const username = params?.username as string;
  const { t } = useI18n();
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<'posts' | 'reels' | 'saved'>('posts');

  const { data: userData, loading: userLoading } = useQuery(USER_BY_USERNAME, {
    variables: { username },
  });

  const targetUser = userData?.userByUsername;
  const isOwnProfile = currentUser?.username === username;

  const { data: postsData, loading: postsLoading } = useQuery(POSTS_BY_USER, {
    variables: { userId: targetUser?.id },
    skip: !targetUser?.id,
  });

  const { data: isFollowingData } = useQuery(IS_FOLLOWING, {
    variables: { userId: targetUser?.id },
    skip: !targetUser?.id || isOwnProfile,
  });

  const [followMut] = useMutation(FOLLOW_USER, {
    refetchQueries: [
      { query: IS_FOLLOWING, variables: { userId: targetUser?.id } },
    ],
  });
  const [unfollowMut] = useMutation(UNFOLLOW_USER, {
    refetchQueries: [
      { query: IS_FOLLOWING, variables: { userId: targetUser?.id } },
    ],
  });

  const isFollowing = isFollowingData?.isFollowing || false;

  const handleFollow = async () => {
    if (isFollowing) {
      await unfollowMut({ variables: { userId: targetUser.id } });
    } else {
      await followMut({ variables: { userId: targetUser.id } });
    }
  };

  if (userLoading || !targetUser) {
    return (
      <div className="py-8 px-4">
        <div className="flex items-center gap-6 mb-8 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-200 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  const posts = postsData?.postsByUser || [];

  return (
    <div className="py-4 px-2 lg:px-4">
      {/* Profile header */}
      <header className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12 mb-6">
          <div className="flex justify-center lg:justify-start">
            <Avatar
              src={targetUser.avatarUrl}
              alt={targetUser.username}
              size="xl"
              hasStory
            />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="flex items-center gap-1">
                <h1 className="text-xl font-semibold">{targetUser.username}</h1>
                {targetUser.isVerified && (
                  <VerifiedIcon className="w-4 h-4 text-blue-500 fill-blue-500" />
                )}
              </div>
              {isOwnProfile ? (
                <div className="flex gap-2">
                  <Link href="/settings">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                      {t('profile.editProfile')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant={isFollowing ? 'outline' : 'primary'}
                    size="sm"
                    onClick={handleFollow}
                  >
                    {isFollowing ? t('profile.following') : t('profile.follow')}
                  </Button>
                  <Link href="/direct">
                    <Button variant="outline" size="sm">
                      <MessageCircle className="w-4 h-4" />
                      {t('profile.message')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 mb-4 text-sm">
              <span>
                <strong className="font-semibold">{formatCount(posts.length)}</strong>{' '}
                {t('profile.posts')}
              </span>
              <span>
                <strong className="font-semibold">0</strong> {t('profile.followers')}
              </span>
              <span>
                <strong className="font-semibold">0</strong> {t('profile.following')}
              </span>
            </div>

            {/* Bio */}
            <div className="text-sm">
              {targetUser.fullName && (
                <p className="font-semibold mb-1">{targetUser.fullName}</p>
              )}
              {targetUser.bio && (
                <p className="whitespace-pre-wrap text-lenz-dark mb-1">{targetUser.bio}</p>
              )}
              {targetUser.website && (
                <a
                  href={targetUser.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lenz-primary hover:underline inline-flex items-center gap-1"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  {targetUser.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-t border-lenz-border">
        <div className="flex justify-around">
          {[
            { key: 'posts' as const, icon: Grid3x3, label: t('profile.posts') },
            { key: 'reels' as const, icon: Film, label: 'Reels' },
            ...(isOwnProfile
              ? [{ key: 'saved' as const, icon: Bookmark, label: t('post.saved') }]
              : []),
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-wide border-t-2 -mt-px ${
                tab === key
                  ? 'border-lenz-dark text-lenz-dark font-semibold'
                  : 'border-transparent text-lenz-gray hover:text-lenz-dark'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      {postsLoading ? (
        <div className="grid grid-cols-3 gap-1 mt-2">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <Grid3x3 className="w-12 h-12 mx-auto text-lenz-gray mb-3" />
          <p className="text-lenz-gray">{t('post.noPosts')}</p>
          {isOwnProfile && (
            <Link href="/create" className="inline-block mt-3 text-lenz-primary font-semibold">
              {t('post.create')}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 mt-2">
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
                <span>{formatCount(post.likesCount)}</span>
                <span>{formatCount(post.commentsCount)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
