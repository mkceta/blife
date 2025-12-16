'use client'

import { MarketFeed } from '@/features/home/components/market-feed'
import { MarketFilters } from '@/lib/services/market.service'
import type { Listing } from '@/lib/types'

interface MarketFeedContentProps {
    initialListings: Listing[]
    initialFavorites: string[]
    initialAverageLikes: number
    currentUserId?: string
    initialFilters: MarketFilters
}

export function MarketFeedContent({
    initialListings,
    initialFavorites,
    initialAverageLikes,
    currentUserId,
    initialFilters,
}: MarketFeedContentProps) {
    // MarketFeed will handle everything with React Query
    // but now receives real server-fetched data as initialData
    return (
        <MarketFeed
            initialListings={initialListings}
            initialFavorites={initialFavorites}
            initialAverageLikes={initialAverageLikes}
            currentUserId={currentUserId}
            initialFilters={initialFilters}
        />
    )
}

