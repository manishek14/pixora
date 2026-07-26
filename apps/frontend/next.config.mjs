/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '4000' },
      { protocol: 'http', hostname: '127.0.0.1', port: '4000' },
    ],
  },
  // Proxy /uploads and /api to backend during dev to avoid CORS issues
  async rewrites() {
    return [
      { source: '/uploads/:path*', destination: 'http://localhost:4000/uploads/:path*' },
      { source: '/api/:path*', destination: 'http://localhost:4000/api/:path*' },
    ];
  },
};

export default nextConfig;
