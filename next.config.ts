import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
    ],
  },
};

export default nextConfig;
