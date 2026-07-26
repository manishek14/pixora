import type { Config } from 'tailwindcss';

const config: Config = {
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
        // Instagram-inspired palette
        lenz: {
          primary: '#E1306C',
          secondary: '#833AB4',
          accent: '#F77737',
          yellow: '#FCAF45',
          bg: '#FAFAFA',
          dark: '#262626',
          gray: '#8E8E8E',
          border: '#DBDBDB',
        },
      },
      backgroundImage: {
        'lenz-gradient':
          'linear-gradient(45deg, #F09433 0%, #E6683C 25%, #DC2743 50%, #CC2366 75%, #BC1888 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
