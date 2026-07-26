'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { REGISTER } from '@/graphql/auth';
import { Camera, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [registerMut] = useMutation(REGISTER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await registerMut({
        variables: {
          input: {
            username: username.trim().toLowerCase(),
            email: email.trim().toLowerCase(),
            password,
            fullName: fullName.trim() || undefined,
          },
        },
      });
      if (data?.register) {
        login(data.register.accessToken, data.register.refreshToken);
        router.push('/');
      }
    } catch (err: any) {
      setError(err?.message || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-lenz-bg">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-lenz-gradient items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold lenz-gradient-text">{t('app.name')}</h1>
          <p className="text-lenz-gray mt-2">{t('auth.joinLenz')}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-lenz-border rounded-2xl p-6 space-y-4"
        >
          <Input
            name="username"
            label={t('auth.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ali_dev"
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_.]+"
            autoFocus
          />
          <Input
            type="email"
            name="email"
            label={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <Input
            name="fullName"
            label={t('auth.fullName')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ali Developer"
            maxLength={100}
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
              minLength={8}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-[34px] text-lenz-gray hover:text-lenz-dark"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-md p-2">{error}</p>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading}>
            {t('auth.signup')}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-lenz-gray">
          {t('auth.haveAccount')}{' '}
          <Link href="/login" className="text-lenz-primary font-semibold hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </main>
  );
}
