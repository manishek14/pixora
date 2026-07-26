'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { CREATE_POST } from '@/graphql/posts';
import { FEED } from '@/graphql/posts';
import { ImagePlus, X, Send, Loader2 } from 'lucide-react';

interface UploadedMedia {
  url: string;
  preview: string;
  isVideo: boolean;
  name: string;
}

export default function CreatePostPage() {
  return (
    <AppShell>
      <CreateContent />
    </AppShell>
  );
}

function CreateContent() {
  const { t } = useI18n();
  const router = useRouter();
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createPost] = useMutation(CREATE_POST, {
    refetchQueries: [{ query: FEED, variables: { limit: 10, offset: 0 } }],
  });

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      const filesArr = Array.from(files).slice(0, 10 - media.length);
      for (const f of filesArr) formData.append('files', f);

      const res = await fetch('/api/uploads/multiple', { method: 'POST', body: formData });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || 'upload failed');
      }
      const results = await res.json();
      const newMedia: UploadedMedia[] = results.map((r: any) => ({
        url: r.url,
        preview: r.url,
        isVideo: r.mimeType.startsWith('video/'),
        name: r.filename,
      }));
      setMedia((prev) => [...prev, ...newMedia]);
    } catch (err: any) {
      setError(err?.message || t('common.error'));
    } finally {
      setUploading(false);
      // reset input value so user can re-select same file
      if (e.target) e.target.value = '';
    }
  }, [media, t]);

  const removeMedia = (idx: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (media.length === 0) {
      setError(t('post.upload'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createPost({
        variables: {
          input: {
            caption: caption.trim() || undefined,
            mediaUrls: media.map((m) => m.url),
            location: location.trim() || undefined,
            isReel: media.length === 1 && media[0].isVideo,
          },
        },
      });
      router.push('/');
    } catch (err: any) {
      setError(err?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-4 px-2">
      <h1 className="text-2xl font-bold mb-6">{t('post.create')}</h1>

      {/* Media dropzone */}
      <div className="bg-white border border-lenz-border rounded-xl p-4 mb-4">
        <label className="block">
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="cursor-pointer border-2 border-dashed border-lenz-border rounded-lg p-8 text-center hover:border-lenz-primary/50 hover:bg-lenz-primary/5 transition-colors">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 mx-auto mb-2 text-lenz-primary animate-spin" />
                <p className="text-sm text-lenz-gray">{t('common.loading')}</p>
              </>
            ) : (
              <>
                <ImagePlus className="w-8 h-8 mx-auto mb-2 text-lenz-gray" />
                <p className="text-sm font-medium">{t('post.upload')}</p>
                <p className="text-xs text-lenz-gray mt-1">PNG, JPG, WEBP, MP4 — up to 50MB</p>
              </>
            )}
          </div>
        </label>

        {media.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {media.map((m, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-black">
                {m.isVideo ? (
                  <video src={m.preview} className="w-full h-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.preview} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => removeMedia(i)}
                  className="absolute top-1 end-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="bg-white border border-lenz-border rounded-xl p-4 mb-4">
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t('post.caption')}
          rows={4}
          maxLength={2200}
        />
        <div className="text-end text-xs text-lenz-gray mt-1">
          {caption.length}/2200
        </div>
      </div>

      {/* Location */}
      <div className="bg-white border border-lenz-border rounded-xl p-4 mb-4">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          maxLength={100}
          className="w-full h-11 px-3 text-sm outline-none bg-transparent"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-md p-3 mb-4">{error}</p>
      )}

      <Button
        onClick={handleSubmit}
        fullWidth
        size="lg"
        loading={submitting}
        disabled={media.length === 0}
      >
        <Send className="w-4 h-4" />
        {t('post.shareNow')}
      </Button>
    </div>
  );
}
