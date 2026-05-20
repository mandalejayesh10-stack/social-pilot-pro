import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

// The internal backend URL for server-side proxying (always localhost in dev)
// NEXT_PUBLIC_BACKEND_URL is used for browser-side direct links (OAuth redirects, etc.)
const BACKEND_PROXY_URL = process.env.BACKEND_PROXY_URL || 'http://localhost:3000';

const nextConfig: NextConfig = {
  // Only use standalone in production builds
  ...(isProd ? { output: 'standalone' } : {}),
  experimental: {
    serverActions: { allowedOrigins: ['localhost:4200'] },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_PROXY_URL}/api/:path*`,
      },
      {
        // Proxy static uploaded files from backend to frontend dev server
        source: '/uploads/:path*',
        destination: `${BACKEND_PROXY_URL}/uploads/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.ytimg.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.ngrok-free.app' },
      { protocol: 'https', hostname: '**.ngrok-free.dev' },
    ],
  },
};

export default nextConfig;
