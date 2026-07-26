import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // works with next-themes `attribute="class"`
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Vazirmatn', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Vazirmatn', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Telegram-blue brand accent (overridable per-theme via CSS vars)
        lenz: {
          primary: 'var(--lenz-primary)',
          'primary-soft': 'var(--lenz-primary-soft)',
          accent: 'var(--lenz-accent)',
          bg: 'var(--lenz-bg)',
          surface: 'var(--lenz-surface)',
          'surface-2': 'var(--lenz-surface-2)',
          dark: 'var(--lenz-text)',
          gray: 'var(--lenz-text-muted)',
          border: 'var(--lenz-border)',
          danger: 'var(--lenz-danger)',
          success: 'var(--lenz-success)',
          warning: 'var(--lenz-warning)',
        },
      },
      backgroundImage: {
        'lenz-gradient':
          'linear-gradient(135deg, var(--lenz-primary) 0%, var(--lenz-accent) 100%)',
        'glass-shine':
          'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0) 60%)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.18)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.28)',
        'glow': '0 0 0 1px rgba(42, 171, 238, 0.4), 0 8px 24px rgba(42, 171, 238, 0.25)',
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-12px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
