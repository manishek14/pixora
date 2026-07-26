'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Home,
  Compass,
  PlusSquare,
  MessageCircle,
  User,
  Search,
  LogOut,
  Globe,
  Camera,
} from 'lucide-react';

export function Sidebar() {
  const { t, locale, toggleLocale } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const items = [
    { href: '/', icon: Home, label: t('nav.home') },
    { href: '/explore', icon: Compass, label: t('nav.explore') },
    { href: '/search', icon: Search, label: t('nav.search') },
    { href: '/create', icon: PlusSquare, label: t('nav.create') },
    { href: '/direct', icon: MessageCircle, label: t('nav.direct') },
    { href: `/profile/${user.username}`, icon: User, label: t('nav.profile') },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside
      className={cn(
        'fixed bottom-0 top-0 z-30 flex w-20 flex-col lg:w-64',
        locale === 'fa' ? 'right-0' : 'left-0',
      )}
    >
      {/* Glass dock surface */}
      <div className="glass-dock m-3 flex h-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-3xl">
        {/* Logo */}
        <div className="flex h-20 items-center justify-center border-b border-white/5 px-4 lg:justify-start lg:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-[0_4px_14px_rgba(42,171,238,0.4)]"
              style={{ background: 'linear-gradient(135deg, #2AABEE 0%, #4FC3F7 100%)' }}
            >
              <Camera className="h-5 w-5 text-white" />
            </div>
            <span className="hidden text-2xl font-bold lenz-gradient-text lg:inline">
              {t('app.name')}
            </span>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1.5 px-2.5 py-4 lg:px-3">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-4 rounded-2xl px-3 py-2.5 transition',
                  isActive
                    ? 'bg-lenz-primary/15 text-lenz-primary'
                    : 'text-lenz-gray hover:bg-white/5 hover:text-lenz-dark',
                )}
                title={item.label}
              >
                <item.icon
                  className={cn(
                    'h-6 w-6 shrink-0 transition',
                    isActive && 'drop-shadow-[0_0_8px_rgba(42,171,238,0.5)]',
                  )}
                />
                <span
                  className={cn(
                    'hidden text-base lg:inline',
                    isActive && 'font-semibold',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="space-y-2 border-t border-white/5 px-2.5 py-4 lg:px-3">
          {/* Theme toggle row */}
          <div className="flex items-center justify-between gap-3 px-3 py-1.5 lg:px-1">
            <span className="hidden text-sm text-lenz-gray lg:inline">{t('theme.toggle')}</span>
            <ThemeToggle compact />
          </div>

          {/* Locale toggle */}
          <button
            onClick={toggleLocale}
            className="flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-lenz-gray transition hover:bg-white/5 hover:text-lenz-dark"
            title={locale === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
          >
            <Globe className="h-6 w-6 shrink-0" />
            <span className="hidden text-base lg:inline">
              {locale === 'fa' ? 'English' : 'فارسی'}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-rose-400 transition hover:bg-rose-500/10"
            title={t('auth.logout')}
          >
            <LogOut className="h-6 w-6 shrink-0" />
            <span className="hidden text-base lg:inline">{t('auth.logout')}</span>
          </button>

          {/* User mini-card */}
          {user && (
            <Link
              href={`/profile/${user.username}`}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-white/5"
            >
              <Avatar src={user.avatarUrl} alt={user.username} size="sm" />
              <div className="hidden min-w-0 flex-1 lg:block">
                <p className="truncate text-sm font-medium text-lenz-dark">{user.username}</p>
                <p className="truncate text-xs text-lenz-gray">
                  @{user.username}
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { t } = useI18n();
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const items = [
    { href: '/', icon: Home, label: t('nav.home') },
    { href: '/explore', icon: Compass, label: t('nav.explore') },
    { href: '/create', icon: PlusSquare, label: t('nav.create') },
    { href: '/direct', icon: MessageCircle, label: t('nav.direct') },
    { href: `/profile/${user.username}`, icon: User, label: t('nav.profile') },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 lg:hidden">
      <div className="glass-dock flex items-center justify-around rounded-3xl py-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-10 w-12 items-center justify-center rounded-2xl transition',
                isActive
                  ? 'bg-lenz-primary/20 text-lenz-primary drop-shadow-[0_0_8px_rgba(42,171,238,0.5)]'
                  : 'text-lenz-gray hover:text-lenz-dark',
              )}
              aria-label={item.label}
            >
              <item.icon className="h-6 w-6" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
