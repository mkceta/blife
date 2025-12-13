import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Optimizaciones de producción
    output: 'export', // Para Capacitor

    // Optimizar imágenes
    images: {
        unoptimized: true, // Requerido para export estático
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
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
