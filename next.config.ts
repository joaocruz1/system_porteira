import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    remotePatterns: [
      {
        protocol: 'https', 
        hostname: 'wrqkc1gxttp78mqe.public.blob.vercel-storage.com',
        port: '', 
        pathname: '/produtos/**', 
      },
      
    ],
  },
};

export default nextConfig;
