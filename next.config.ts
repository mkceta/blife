import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Optimizar imágenes
    images: {
        unoptimized: false, // Habilitar optimización
        formats: ['image/webp', 'image/avif'], // Formatos modernos
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048], // Tamaños responsive
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Tamaños de íconos
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },

    // Optimizar bundle
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
    },

    // Experimental: optimizaciones
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            'framer-motion',
        ],
    },
};

export default nextConfig;

