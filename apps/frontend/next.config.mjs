/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4000' },
      { protocol: 'http', hostname: '127.0.0.1', port: '4000' },
    ],
  },
  // Proxy /uploads, /api (REST), and /api/graphql to backend during dev.
  // Routing /api/graphql through Next.js means the browser only ever talks
  // to its own origin → no CORS preflight, no "Failed to fetch" when the
  // user's machine can't reach :4000 directly.
  async rewrites() {
    return [
      { source: '/uploads/:path*', destination: 'http://localhost:4000/uploads/:path*' },
      // GraphQL endpoint — must come BEFORE the generic /api/* catch-all
      { source: '/api/graphql', destination: 'http://localhost:4000/graphql' },
      { source: '/api/:path*', destination: 'http://localhost:4000/api/:path*' },
    ];
  },
};

export default nextConfig;
