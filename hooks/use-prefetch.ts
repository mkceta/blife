'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { fetchMarketListingsAction, fetchCommunityPostsAction } from '@/app/feed-actions'
import { MarketFilters } from '@/lib/services/market.service'

/**
 * Hook para prefetch de datos en hover
 */
export function usePrefetchOnHover(
    queryKey: unknown[],
    queryFn: () => Promise<any>,
    enabled = true
) {
    const queryClient = useQueryClient()

    const handleMouseEnter = () => {
        if (enabled) {
            queryClient.prefetchQuery({
                queryKey,
                queryFn,
                staleTime: 1000 * 60 * 10, // 10 minutos
            })
        }
    }

    const handleTouchStart = () => {
        if (enabled) {
            queryClient.prefetchQuery({
                queryKey,
                queryFn,
                staleTime: 1000 * 60 * 10,
            })
        }
    }

    return { handleMouseEnter, handleTouchStart }
}

/**
 * Hook para prefetch de rutas críticas en idle time
 */
export function usePrefetchCriticalRoutes() {
    const queryClient = useQueryClient()
    const hasPrefetched = useRef(false)

    useEffect(() => {
        if (hasPrefetched.current) return

        // Usar requestIdleCallback si está disponible, sino setTimeout
        const scheduleIdlePrefetch = (callback: () => void) => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(callback, { timeout: 2000 })
            } else {
                setTimeout(callback, 1000)
            }
        }

        scheduleIdlePrefetch(() => {
            // Prefetch Market listings (default filters)
            queryClient.prefetchQuery({
                queryKey: ['market-listings', {} as MarketFilters, undefined],
                queryFn: () => fetchMarketListingsAction({} as MarketFilters),
                staleTime: 1000 * 60 * 10,
            })

            // Prefetch Community posts (General category)
            queryClient.prefetchQuery({
                queryKey: ['community', 'General', ''],
                queryFn: () => fetchCommunityPostsAction('General', ''),
                staleTime: 1000 * 60 * 10,
            })

            hasPrefetched.current = true
        })
    }, [queryClient])
}

/**
 * Hook específico para prefetch de Market
 */
export function usePrefetchMarket(filters: MarketFilters = {}) {
    const queryClient = useQueryClient()

    const prefetch = () => {
        queryClient.prefetchQuery({
            queryKey: ['market-listings', filters, undefined],
            queryFn: () => fetchMarketListingsAction(filters),
            staleTime: 1000 * 60 * 10,
        })
    }

    return { handleMouseEnter: prefetch, handleTouchStart: prefetch }
}

/**
 * Hook específico para prefetch de Community
 */
export function usePrefetchCommunity(category: string = 'General') {
    const queryClient = useQueryClient()

    const prefetch = () => {
        queryClient.prefetchQuery({
            queryKey: ['community', category, ''],
            queryFn: () => fetchCommunityPostsAction(category, ''),
            staleTime: 1000 * 60 * 10,
        })
    }

    return { handleMouseEnter: prefetch, handleTouchStart: prefetch }
}

