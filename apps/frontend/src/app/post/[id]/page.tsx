'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { AppShell } from '@/components/layout/app-shell';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import {
  POST_BY_ID,
  COMMENTS,
  CREATE_COMMENT,
  DELETE_COMMENT,
  TOGGLE_LIKE,
} from '@/graphql/posts';
import { cn, formatCount, timeAgo, getMediaUrl } from '@/lib/utils';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ArrowLeft,
  MoreHorizontal,
  Verified as VerifiedIcon,
  Trash2,
} from 'lucide-react';

export default function PostDetailPage() {
  return (
    <AppShell>
      <PostDetailContent />
    </AppShell>
  );
}

function PostDetailContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { t } = useI18n();
  const router = useRouter();

  const { data, loading } = useQuery(POST_BY_ID, { variables: { id } });
  const { data: commentsData, refetch: refetchComments } = useQuery(COMMENTS, {
    variables: { postId: id },
  });

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState('');

  const [toggleLike] = useMutation(TOGGLE_LIKE);
  const [createComment] = useMutation(CREATE_COMMENT);
  const [deleteComment] = useMutation(DELETE_COMMENT);

  const post = data?.post;

  useEffect(() => {
    if (post) setLikesCount(post.likesCount);
  }, [post]);

  if (loading)
    return <div className="py-8 text-center text-lenz-gray">{t('common.loading')}</div>;

  if (!post)
    return (
      <div className="py-16 text-center">
        <p className="text-lenz-gray mb-3">Post not found</p>
        <Link href="/" className="text-lenz-primary font-semibold">
          {t('common.back')}
        </Link>
      </div>
    );

  const comments = commentsData?.comments || [];

  const handleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    setLikesCount((c) => c + (prev ? -1 : 1));
    try {
      await toggleLike({ variables: { postId: post.id } });
    } catch {
      setLiked(prev);
      setLikesCount(post.likesCount);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await createComment({
        variables: { input: { postId: post.id, text: commentText.trim() } },
      });
      setCommentText('');
      refetchComments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (cid: string) => {
    try {
      await deleteComment({ variables: { id: cid } });
      refetchComments();
    } catch (e) {
      console.error(e);
    }
  };

  const isVideo = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url) || post.isReel;

  return (
    <div className="py-4 px-2">
      <button
        onClick={() => router.back()}
        className="mb-4 lg:hidden flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </button>

      <div className="bg-white border border-lenz-border rounded-xl overflow-hidden grid lg:grid-cols-2 gap-0">
        {/* Media */}
        <div className="aspect-square lg:aspect-auto bg-black flex items-center justify-center">
          {post.mediaUrls[0] && isVideo(post.mediaUrls[0]) ? (
            <video
              src={getMediaUrl(post.mediaUrls[0])}
              className="w-full h-full object-contain"
              controls
              autoPlay
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

        {/* Side panel */}
        <div className="flex flex-col max-h-[80vh]">
          {/* Header */}
          <header className="flex items-center justify-between p-3 border-b border-lenz-border">
            <Link
              href={`/profile/${post.author.username}`}
              className="flex items-center gap-3"
            >
              <Avatar src={post.author.avatarUrl} alt={post.author.username} size="sm" hasStory />
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">{post.author.username}</span>
                {post.author.isVerified && (
                  <VerifiedIcon className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                )}
              </div>
            </Link>
            <button className="p-1 text-lenz-dark">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </header>

          {/* Caption + comments */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Caption as first comment */}
            {post.caption && (
              <div className="flex gap-3">
                <Avatar src={post.author.avatarUrl} alt={post.author.username} size="sm" />
                <div className="flex-1">
                  <p className="text-sm">
                    <Link
                      href={`/profile/${post.author.username}`}
                      className="font-semibold me-1"
                    >
                      {post.author.username}
                    </Link>
                    {post.caption}
                  </p>
                  <p className="text-xs text-lenz-gray mt-0.5">{timeAgo(post.createdAt)}</p>
                </div>
              </div>
            )}

            {comments.length === 0 ? (
              <p className="text-center text-lenz-gray text-sm py-6">{t('post.noPosts')}</p>
            ) : (
              comments.map((c: any) => (
                <div key={c.id} className="group flex gap-3">
                  <Avatar src={c.user.avatarUrl} alt={c.user.username} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <Link
                        href={`/profile/${c.user.username}`}
                        className="font-semibold me-1"
                      >
                        {c.user.username}
                      </Link>
                      {c.text}
                    </p>
                    <p className="text-xs text-lenz-gray mt-0.5">{timeAgo(c.createdAt)}</p>
                    {c.replies && c.replies.length > 0 && (
                      <div className="ms-6 mt-2 space-y-2 border-s-2 border-lenz-border ps-3">
                        {c.replies.map((r: any) => (
                          <div key={r.id} className="flex gap-2">
                            <Avatar src={r.user.avatarUrl} alt={r.user.username} size="xs" />
                            <div>
                              <p className="text-sm">
                                <Link
                                  href={`/profile/${r.user.username}`}
                                  className="font-semibold me-1"
                                >
                                  {r.user.username}
                                </Link>
                                {r.text}
                              </p>
                              <p className="text-xs text-lenz-gray mt-0.5">
                                {timeAgo(r.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="opacity-0 group-hover:opacity-100 text-lenz-gray hover:text-red-500"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-lenz-border">
            <div className="flex items-center justify-between px-3 pt-2">
              <div className="flex items-center gap-3">
                <button onClick={handleLike} className="p-1.5 hover:opacity-60 transition-opacity">
                  <Heart className={cn('w-6 h-6', liked && 'fill-red-500 text-red-500')} />
                </button>
                <button className="p-1.5 hover:opacity-60 transition-opacity">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button className="p-1.5 hover:opacity-60 transition-opacity">
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <button className="p-1.5 hover:opacity-60 transition-opacity">
                <Bookmark className="w-6 h-6" />
              </button>
            </div>
            <div className="px-3 pb-1 text-sm font-semibold">
              {formatCount(likesCount)} {t('post.likes')}
            </div>
            <div className="px-3 pb-2 text-[10px] text-lenz-gray uppercase">
              {timeAgo(post.createdAt)}
            </div>

            {/* Comment input */}
            <div className="flex items-center gap-2 px-3 py-2 border-t border-lenz-border">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                placeholder={t('post.addComment')}
                className="flex-1 text-sm outline-none bg-transparent"
              />
              {commentText.trim() && (
                <button
                  onClick={handleComment}
                  className="text-sm font-semibold text-lenz-primary"
                >
                  {t('common.send')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
