import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

// In production: BACKEND_PROXY_URL points to Railway backend
// In dev: always localhost
const BACKEND_PROXY_URL = process.env.BACKEND_PROXY_URL || 'http://localhost:3000';

const nextConfig: NextConfig = {
  ...(isProd ? { output: 'standalone' } : {}),
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:4200',
        // Allow Vercel preview + production domains
        '*.vercel.app',
        process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '') || '',
      ].filter(Boolean),
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_PROXY_URL}/api/:path*`,
      },
      {
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
      { protocol: 'https', hostname: '**.railway.app' },
      { protocol: 'https', hostname: '**.up.railway.app' },
    ],
  },
};

export default nextConfig;
