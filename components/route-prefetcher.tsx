'use client'

import { usePrefetchRoutes } from '@/hooks/use-prefetch-routes'

/**
 * Component that prefetches critical routes for better navigation performance
 * Place this in your root layout to enable automatic prefetching
 */
export function RoutePrefetcher() {
    usePrefetchRoutes()
    return null
}
