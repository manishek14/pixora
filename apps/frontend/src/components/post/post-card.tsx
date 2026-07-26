'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { cn, formatCount, timeAgo, getMediaUrl } from '@/lib/utils';
import { TOGGLE_LIKE, CREATE_COMMENT, COMMENTS } from '@/graphql/posts';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Verified as VerifiedIcon,
} from 'lucide-react';

interface PostCardProps {
  post: {
    id: string;
    caption?: string | null;
    mediaUrls: string[];
    hashtags?: string[];
    location?: string | null;
    isReel?: boolean;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    author: {
      id: string;
      username: string;
      fullName?: string | null;
      avatarUrl?: string | null;
      isVerified?: boolean;
    };
  };
}

export function PostCard({ post }: PostCardProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [saved, setSaved] = useState(false);

  const [toggleLike] = useMutation(TOGGLE_LIKE);
  const [createComment] = useMutation(CREATE_COMMENT);

  const handleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    setLikesCount((c) => c + (prev ? -1 : 1));
    try {
      await toggleLike({ variables: { postId: post.id } });
    } catch {
      // revert on error
      setLiked(prev);
      setLikesCount(post.likesCount);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await createComment({
        variables: {
          input: { postId: post.id, text: commentText.trim() },
        },
        refetchQueries: [{ query: COMMENTS, variables: { postId: post.id } }],
      });
      setCommentText('');
      setShowComments(true);
    } catch (e) {
      console.error(e);
    }
  };

  const isVideo = (url: string) =>
    /\.(mp4|webm|mov)(\?|$)/i.test(url) || post.isReel;

  return (
    <article className="bg-white border border-lenz-border rounded-xl mb-4 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-3">
        <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3">
          <Avatar src={post.author.avatarUrl} alt={post.author.username} size="sm" hasStory />
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">{post.author.username}</span>
              {post.author.isVerified && (
                <VerifiedIcon className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
              )}
            </div>
            {post.location && (
              <span className="text-xs text-lenz-gray">{post.location}</span>
            )}
          </div>
        </Link>
        <button className="text-lenz-dark p-1">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </header>

      {/* Media */}
      <div className="relative bg-black aspect-square">
        {post.mediaUrls[0] && isVideo(post.mediaUrls[0]) ? (
          <video
            src={getMediaUrl(post.mediaUrls[0])}
            className="w-full h-full object-contain"
            controls
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getMediaUrl(post.mediaUrls[0])}
            alt={post.caption || 'post'}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 pt-2">
        <div className="flex items-center gap-3">
          <button onClick={handleLike} className="p-1.5 hover:opacity-60 transition-opacity">
            <Heart
              className={cn(
                'w-6 h-6',
                liked && 'fill-red-500 text-red-500',
              )}
            />
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="p-1.5 hover:opacity-60 transition-opacity"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="p-1.5 hover:opacity-60 transition-opacity">
            <Send className="w-6 h-6" />
          </button>
        </div>
        <button
          onClick={() => setSaved(!saved)}
          className="p-1.5 hover:opacity-60 transition-opacity"
        >
          <Bookmark className={cn('w-6 h-6', saved && 'fill-lenz-dark text-lenz-dark')} />
        </button>
      </div>

      {/* Likes count */}
      <div className="px-3 py-1 text-sm font-semibold">
        {formatCount(likesCount)} {t('post.likes')}
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-3 pb-2 text-sm">
          <Link href={`/profile/${post.author.username}`} className="font-semibold me-1">
            {post.author.username}
          </Link>
          <CaptionWithHashtags caption={post.caption} />
        </div>
      )}

      {/* Comments toggle */}
      {post.commentsCount > 0 && (
        <button
          onClick={() => setShowComments(true)}
          className="px-3 pb-1 text-xs text-lenz-gray block hover:underline"
        >
          {formatCount(post.commentsCount)} {t('post.comments')}
        </button>
      )}

      <div className="px-3 pb-1 text-[10px] text-lenz-gray uppercase">
        {timeAgo(post.createdAt)}
      </div>

      {/* Comment input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-lenz-border mt-1">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleComment()}
          placeholder={t('post.addComment')}
          className="flex-1 text-sm outline-none bg-transparent"
        />
        {commentText.trim() && (
          <button onClick={handleComment} className="text-sm font-semibold text-lenz-primary">
            {t('common.send')}
          </button>
        )}
      </div>
    </article>
  );
}

function CaptionWithHashtags({ caption }: { caption: string }) {
  const parts = caption.split(/(#[\w\u0600-\u06FF]+|@[\w_.]+)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          return (
            <Link key={i} href={`/hashtag/${part.slice(1)}`} className="text-lenz-primary hover:underline">
              {part}
            </Link>
          );
        }
        if (part.startsWith('@')) {
          return (
            <Link key={i} href={`/profile/${part.slice(1)}`} className="text-lenz-primary hover:underline">
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
