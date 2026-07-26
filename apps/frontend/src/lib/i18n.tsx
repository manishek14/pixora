'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Locale = 'fa' | 'en';
export type Direction = 'rtl' | 'ltr';

interface I18nContextValue {
  locale: Locale;
  dir: Direction;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// Translation dictionary
const dict: Record<Locale, Record<string, string>> = {
  en: {
    // Common
    'app.name': 'Lenz',
    'app.tagline': 'Share your moments',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.send': 'Send',
    'common.search': 'Search',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.more': 'More',

    // Auth
    'auth.login': 'Log in',
    'auth.signup': 'Sign up',
    'auth.logout': 'Log out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.username': 'Username',
    'auth.fullName': 'Full name',
    'auth.haveAccount': 'Have an account?',
    'auth.noAccount': "Don't have an account?",
    'auth.loginFailed': 'Invalid email or password',
    'auth.registerFailed': 'Could not register',
    'auth.welcomeBack': 'Welcome back',
    'auth.joinLenz': 'Join Lenz today',
    'auth.passwordMin': 'Password must be at least 8 characters',

    // Nav
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.create': 'Create',
    'nav.direct': 'Messages',
    'nav.profile': 'Profile',
    'nav.search': 'Search',

    // Post
    'post.like': 'Like',
    'post.comment': 'Comment',
    'post.share': 'Share',
    'post.save': 'Save',
    'post.saved': 'Saved',
    'post.likes': 'likes',
    'post.comments': 'comments',
    'post.addComment': 'Add a comment...',
    'post.create': 'Create post',
    'post.caption': 'Write a caption...',
    'post.shareNow': 'Share',
    'post.upload': 'Upload media',
    'post.noPosts': 'No posts yet',
    'post.viewComments': 'View all comments',
    'post.deleteConfirm': 'Delete this post?',

    // Profile
    'profile.posts': 'posts',
    'profile.followers': 'followers',
    'profile.followingCount': 'following',
    'profile.follow': 'Follow',
    'profile.following': 'Following',
    'profile.unfollow': 'Unfollow',
    'profile.editProfile': 'Edit profile',
    'profile.message': 'Message',
    'profile.bio': 'Bio',
    'profile.website': 'Website',

    // Feed
    'feed.welcome': 'Welcome to Lenz',
    'feed.empty': 'Your feed is empty. Follow people to see their posts!',
    'feed.explore': 'Explore posts',
    'feed.discover': 'Discover',

    // Search
    'search.users': 'Users',
    'search.noResults': 'No results found',
    'search.placeholder': 'Search users...',

    // Direct
    'direct.title': 'Direct',
    'direct.empty': 'Your messages',
    'direct.empty.desc': 'Send private photos and messages to a friend or group',
    'direct.send': 'Send message',
    'direct.type': 'Type a message...',

    // Story
    'story.add': 'Your story',
    'story.viewAll': 'View all',

    // Theme
    'theme.toggle': 'Toggle theme',
    'theme.dark': 'Dark',
    'theme.light': 'Light',
    'theme.system': 'System',

    // Errors
    'error.required': 'This field is required',
    'error.invalid': 'Invalid value',
    'error.network': 'Network error. Please try again.',
  },
  fa: {
    // Common
    'app.name': 'لنز',
    'app.tagline': 'لحظه‌هات رو به اشتراک بذار',
    'common.loading': 'در حال بارگذاری...',
    'common.error': 'خطایی رخ داد',
    'common.save': 'ذخیره',
    'common.cancel': 'انصراف',
    'common.delete': 'حذف',
    'common.edit': 'ویرایش',
    'common.send': 'ارسال',
    'common.search': 'جستجو',
    'common.close': 'بستن',
    'common.back': 'بازگشت',
    'common.more': 'بیشتر',

    // Auth
    'auth.login': 'ورود',
    'auth.signup': 'ثبت‌نام',
    'auth.logout': 'خروج',
    'auth.email': 'ایمیل',
    'auth.password': 'رمز عبور',
    'auth.username': 'نام کاربری',
    'auth.fullName': 'نام کامل',
    'auth.haveAccount': 'حساب کاربری داری؟',
    'auth.noAccount': 'حساب کاربری نداری؟',
    'auth.loginFailed': 'ایمیل یا رمز اشتباه است',
    'auth.registerFailed': 'ثبت‌نام ناموفق بود',
    'auth.welcomeBack': 'خوش آمدی',
    'auth.joinLenz': 'همین امروز به لنز بپیوند',
    'auth.passwordMin': 'رمز عبور باید حداقل ۸ کاراکتر باشد',

    // Nav
    'nav.home': 'خانه',
    'nav.explore': 'اکسپلور',
    'nav.create': 'ساخت',
    'nav.direct': 'پیام‌ها',
    'nav.profile': 'پروفایل',
    'nav.search': 'جستجو',

    // Post
    'post.like': 'لایک',
    'post.comment': 'کامنت',
    'post.share': 'اشتراک',
    'post.save': 'ذخیره',
    'post.saved': 'ذخیره شد',
    'post.likes': 'لایک',
    'post.comments': 'کامنت',
    'post.addComment': 'کامنت بنویس...',
    'post.create': 'ساخت پست',
    'post.caption': 'کپشن بنویس...',
    'post.shareNow': 'اشتراک‌گذاری',
    'post.upload': 'آپلود مدیا',
    'post.noPosts': 'هنوز پستی وجود ندارد',
    'post.viewComments': 'مشاهده همه کامنت‌ها',
    'post.deleteConfirm': 'این پست حذف شود؟',

    // Profile
    'profile.posts': 'پست',
    'profile.followers': 'فالوور',
    'profile.followingCount': 'فالووینگ',
    'profile.follow': 'فالو',
    'profile.following': 'فالو شده',
    'profile.unfollow': 'آنفالو',
    'profile.editProfile': 'ویرایش پروفایل',
    'profile.message': 'پیام',
    'profile.bio': 'بیوگرافی',
    'profile.website': 'وب‌سایت',

    // Feed
    'feed.welcome': 'به لنز خوش آمدی',
    'feed.empty': 'فیدت خالیه. افراد رو فالو کن تا پست‌هاشون رو ببینی!',
    'feed.explore': 'پست‌های اکسپلور',
    'feed.discover': 'کشف کن',

    // Search
    'search.users': 'کاربران',
    'search.noResults': 'نتیجه‌ای پیدا نشد',
    'search.placeholder': 'جستجوی کاربران...',

    // Direct
    'direct.title': 'دایرکت',
    'direct.empty': 'پیام‌های شما',
    'direct.empty.desc': 'برای دوستانت عکس و پیام خصوصی بفرست',
    'direct.send': 'ارسال پیام',
    'direct.type': 'پیام بنویس...',

    // Story
    'story.add': 'استوری تو',
    'story.viewAll': 'مشاهده همه',

    // Theme
    'theme.toggle': 'تغییر تم',
    'theme.dark': 'تیره',
    'theme.light': 'روشن',
    'theme.system': 'سیستم',

    // Errors
    'error.required': 'این فیلد الزامی است',
    'error.invalid': 'مقدار نامعتبر',
    'error.network': 'خطای شبکه. دوباره امتحان کن.',
  },
};

const LOCALE_KEY = 'lenz_locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fa');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem(LOCALE_KEY)) as Locale | null;
    if (saved === 'fa' || saved === 'en') {
      setLocaleState(saved);
    }
  }, []);

  useEffect(() => {
    const dir: Direction = locale === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') localStorage.setItem(LOCALE_KEY, l);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'fa' ? 'en' : 'fa');
  }, [locale, setLocale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = dict[locale][key] ?? dict.en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(`{${k}}`, String(v));
        }
      }
      return value;
    },
    [locale],
  );

  const dir: Direction = locale === 'fa' ? 'rtl' : 'ltr';

  return (
    <I18nContext.Provider value={{ locale, dir, t, setLocale, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
