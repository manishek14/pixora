import type { Metadata } from 'next';
import './globals.css';
import { ApolloProvider } from './apollo-provider';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Lenz — Share your moments',
  description: 'Lenz — an Instagram-like social platform built with NestJS, GraphQL and Next.js',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23f09433"/><stop offset="50%" stop-color="%23dc2743"/><stop offset="100%" stop-color="%23bc1888"/></linearGradient></defs><rect x="10" y="10" width="80" height="80" rx="20" fill="url(%23g)"/><circle cx="50" cy="50" r="20" fill="none" stroke="white" stroke-width="6"/><circle cx="72" cy="28" r="4" fill="white"/></svg>',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ApolloProvider>
          <Providers>{children}</Providers>
        </ApolloProvider>
      </body>
    </html>
  );
}
