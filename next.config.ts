import type { NextConfig } from "next";

const nextConfig: NextConfig = {

    images: {
        // unoptimized: true, // Disabled to allow Next.js or Loader optimization
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
        ],
    },
};

export default nextConfig;
