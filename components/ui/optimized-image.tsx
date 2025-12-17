'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
    src: string
    alt: string
    className?: string
    fill?: boolean
    width?: number
    height?: number
    priority?: boolean
    sizes?: string
}

/**
 * Optimized Image Component
 * - Lazy loading by default
 * - Blur placeholder while loading
 * - Automatic WebP conversion
 * - Responsive sizing
 */
export function OptimizedImage({
    src,
    alt,
    className,
    fill = false,
    width,
    height,
    priority = false,
    sizes,
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    // Fallback image
    const fallbackSrc = '/placeholder-image.png'

    return (
        <div className={cn('relative overflow-hidden bg-muted', className)}>
            <Image
                src={hasError ? fallbackSrc : src}
                alt={alt}
                fill={fill}
                width={!fill ? width : undefined}
                height={!fill ? height : undefined}
                priority={priority}
                sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
                className={cn(
                    'duration-700 ease-in-out',
                    isLoading ? 'scale-110 blur-lg grayscale' : 'scale-100 blur-0 grayscale-0',
                    fill ? 'object-cover' : ''
                )}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setHasError(true)
                    setIsLoading(false)
                }}
                loading={priority ? 'eager' : 'lazy'}
                quality={85}
            />

            {/* Loading skeleton */}
            {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
            )}
        </div>
    )
}
