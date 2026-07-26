'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { LOGIN } from '@/graphql/auth';
import { toPersianError } from '@/lib/error-map';
import { toast } from '@/lib/toast-store';
import { Camera, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [loginMut] = useMutation(LOGIN);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await loginMut({
        variables: { input: { email: email.trim().toLowerCase(), password } },
      });
      if (data?.login) {
        login(data.login.accessToken, data.login.refreshToken);
        toast.success(t('auth.welcomeBack'));
        router.push('/');
      }
    } catch (err: unknown) {
      const msg = toPersianError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Top-right theme toggle */}
      <div className="absolute end-4 top-4 z-10">
        <ThemeToggle compact />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-[fade-in_400ms_cubic-bezier(0.16,1,0.3,1)]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-[0_8px_24px_rgba(42,171,238,0.45)]"
            style={{
              background: 'linear-gradient(135deg, #2AABEE 0%, #4FC3F7 100%)',
            }}
          >
            <Camera className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold lenz-gradient-text">{t('app.name')}</h1>
          <p className="mt-2 text-sm text-lenz-gray">{t('auth.welcomeBack')}</p>
        </div>

        {/* Glass card */}
        <form
          onSubmit={handleSubmit}
          className="glass-card glass-card--raised p-7"
        >
          <div className="space-y-4">
            <Input
              type="email"
              name="email"
              label={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoFocus
              leadingIcon={<Mail className="h-4 w-4" />}
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                label={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="pe-10"
                leadingIcon={<Lock className="h-4 w-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-3 top-[26px] flex items-center text-lenz-gray transition hover:text-lenz-dark"
                aria-label={showPassword ? 'hide' : 'show'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-sm text-rose-400">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {t('auth.login')}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-lenz-gray">
          {t('auth.noAccount')}{' '}
          <Link
            href="/register"
            className="font-semibold text-lenz-primary transition hover:opacity-80"
          >
            {t('auth.signup')}
          </Link>
        </p>
      </div>

      {/* Decorative blurred blobs */}
      <div
        className="pointer-events-none absolute -start-32 top-1/4 h-80 w-80 rounded-full opacity-30 blur-[100px]"
        style={{ background: 'radial-gradient(circle, #2AABEE 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -end-32 bottom-1/4 h-80 w-80 rounded-full opacity-25 blur-[100px]"
        style={{ background: 'radial-gradient(circle, #4FC3F7 0%, transparent 70%)' }}
      />
    </main>
  );
}
