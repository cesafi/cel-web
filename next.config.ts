import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Bypass Vercel's image optimizer — Cloudinary handles optimization
    minimumCacheTTL: 86400, // 24 hours cache for any remaining optimized images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uqulenyafyepinfweagp.supabase.co',
        port: '',
        pathname: '/**', // Allow all paths from this Supabase project
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**', // Allow all paths from Cloudinary
      },
      {
        protocol: 'https',
        hostname: 'static.wikia.nocookie.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
