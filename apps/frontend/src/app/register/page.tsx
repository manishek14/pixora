'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { REGISTER } from '@/graphql/auth';
import { toPersianError } from '@/lib/error-map';
import { toast } from '@/lib/toast-store';
import { evaluatePassword } from '@/lib/password-strength';
import { Camera, Eye, EyeOff, Mail, Lock, User, AtSign, Check, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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

  // Re-evaluate strength whenever password changes
  const strength = useMemo(() => evaluatePassword(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side gate: don't even hit the backend if the password is too weak.
    // Backend re-validates with the same regex, so this is just for UX.
    if (!strength.isAcceptable) {
      const msg = t('password.requirements');
      setError(msg);
      toast.error(msg);
      return;
    }

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

  // Render a single requirement chip with a check/x icon
  const Requirement = ({ ok, label }: { ok: boolean; label: string }) => (
    <span
      className={`inline-flex items-center gap-1 text-[11px] transition-colors ${
        ok ? 'text-emerald-400' : 'text-lenz-gray'
      }`}
    >
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </span>
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Top-right theme toggle */}
      <div className="absolute end-4 top-4 z-10">
        <ThemeToggle compact />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-[fade-in_400ms_cubic-bezier(0.16,1,0.3,1)]">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-[0_8px_24px_rgba(42,171,238,0.45)]"
            style={{
              background: 'linear-gradient(135deg, #2AABEE 0%, #4FC3F7 100%)',
            }}
          >
            <Camera className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold lenz-gradient-text">{t('app.name')}</h1>
          <p className="mt-2 text-sm text-lenz-gray">{t('auth.joinLenz')}</p>
        </div>

        {/* Glass card */}
        <form onSubmit={handleSubmit} className="glass-card glass-card--raised p-7">
          <div className="space-y-3.5">
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
              leadingIcon={<AtSign className="h-4 w-4" />}
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
              leadingIcon={<Mail className="h-4 w-4" />}
            />
            <Input
              name="fullName"
              label={t('auth.fullName')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ali Developer"
              maxLength={100}
              leadingIcon={<User className="h-4 w-4" />}
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

            {/* Strength meter — only shown when there is input */}
            {password.length > 0 && (
              <div className="space-y-2">
                {/* 4-segment bar */}
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      className="h-1.5 flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor:
                          seg <= strength.score ? strength.color : 'rgba(255,255,255,0.08)',
                      }}
                    />
                  ))}
                </div>
                {/* Label + requirement chips */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium" style={{ color: strength.color }}>
                    {t(strength.labelKey)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <Requirement ok={strength.passed.length} label="8+" />
                  <Requirement ok={strength.passed.lower} label="a-z" />
                  <Requirement ok={strength.passed.upper} label="A-Z" />
                  <Requirement ok={strength.passed.digit} label="0-9" />
                  <Requirement ok={strength.passed.special} label="!@#" />
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-sm text-rose-400">
                {error}
              </p>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={!strength.isAcceptable}
            >
              {t('auth.signup')}
            </Button>

            <p className="pt-1 text-center text-xs text-lenz-gray">
              {t('password.requirements')}
            </p>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-lenz-gray">
          {t('auth.haveAccount')}{' '}
          <Link
            href="/login"
            className="font-semibold text-lenz-primary transition hover:opacity-80"
          >
            {t('auth.login')}
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
