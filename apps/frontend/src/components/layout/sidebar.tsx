'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/ui/avatar';
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
        'fixed top-0 bottom-0 z-30 flex flex-col border-r border-lenz-border bg-white',
        locale === 'fa' ? 'right-0' : 'left-0',
        'w-20 lg:w-64',
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center lg:justify-start h-20 px-4 lg:px-6 border-b border-lenz-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-lenz-gradient flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <span className="hidden lg:block text-2xl font-bold lenz-gradient-text">
            {t('app.name')}
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors',
                isActive && 'font-semibold',
              )}
              title={item.label}
            >
              <item.icon className="w-6 h-6 shrink-0" />
              <span className="hidden lg:inline text-base">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 lg:px-3 py-4 border-t border-lenz-border space-y-1">
        <button
          onClick={toggleLocale}
          className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 w-full transition-colors"
          title={locale === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
        >
          <Globe className="w-6 h-6 shrink-0" />
          <span className="hidden lg:inline text-base">
            {locale === 'fa' ? 'English' : 'فارسی'}
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 w-full transition-colors text-red-500"
          title={t('auth.logout')}
        >
          <LogOut className="w-6 h-6 shrink-0" />
          <span className="hidden lg:inline text-base">{t('auth.logout')}</span>
        </button>
        {user && (
          <Link
            href={`/profile/${user.username}`}
            className="flex items-center gap-4 px-3 py-2 rounded-lg hover:bg-gray-100 w-full transition-colors"
          >
            <Avatar src={user.avatarUrl} alt={user.username} size="sm" />
            <span className="hidden lg:inline text-sm truncate">{user.username}</span>
          </Link>
        )}
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const items = [
    { href: '/', icon: Home },
    { href: '/explore', icon: Compass },
    { href: '/create', icon: PlusSquare },
    { href: '/direct', icon: MessageCircle },
    { href: `/profile/${user.username}`, icon: User },
  ];

  return (
    <nav
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-lenz-border flex items-center justify-around py-2 px-4',
      )}
    >
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'p-2 rounded-lg',
              isActive ? 'text-lenz-primary' : 'text-lenz-dark',
            )}
          >
            <item.icon className="w-6 h-6" />
          </Link>
        );
      })}
    </nav>
  );
}
