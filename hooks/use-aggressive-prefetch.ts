'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { fetchMarketListingsAction, fetchCommunityPostsAction, fetchFlatsAction } from '@/app/feed-actions'

/**
 * Aggressive Prefetch Hook
 * Preloads all main pages data after login for instant navigation
 */
export function useAggressivePrefetch(userId?: string) {
    const queryClient = useQueryClient()
    const supabase = createClient()

    useEffect(() => {
        if (!userId) return

        const prefetchAllPages = async () => {
            try {
                // Prefetch Market listings (most important)
                queryClient.prefetchQuery({
                    queryKey: ['market-listings', {}],
                    queryFn: () => fetchMarketListingsAction({}),
                    staleTime: 1000 * 60 * 10,
                })

                // Prefetch Community posts
                queryClient.prefetchQuery({
                    queryKey: ['community-posts', {}],
                    queryFn: () => fetchCommunityPostsAction({} as any),
                    staleTime: 1000 * 60 * 10,
                })

                // Prefetch Flats
                queryClient.prefetchQuery({
                    queryKey: ['flats', {}],
                    queryFn: () => fetchFlatsAction({}),
                    staleTime: 1000 * 60 * 10,
                })

                // Prefetch user's favorites
                queryClient.prefetchQuery({
                    queryKey: ['favorites', userId],
                    queryFn: async () => {
                        const { data } = await supabase
                            .from('favorites')
                            .select('listing_id')
                            .eq('user_id', userId)
                        return data?.map((f: any) => f.listing_id) || []
                    },
                    staleTime: 1000 * 60 * 5,
                })

                // Prefetch unread messages count
                queryClient.prefetchQuery({
                    queryKey: ['unread-count', userId],
                    queryFn: async () => {
                        const { count } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('recipient_id', userId)
                            .eq('read', false)
                        return count || 0
                    },
                    staleTime: 1000 * 30,
                })

                console.log('✅ Aggressive prefetch completed - all pages ready!')
            } catch (error) {
                console.error('Prefetch error:', error)
            }
        }

        // Start prefetching after a small delay to not block initial render
        const timer = setTimeout(prefetchAllPages, 500)
        return () => clearTimeout(timer)
    }, [userId, queryClient, supabase])
}
