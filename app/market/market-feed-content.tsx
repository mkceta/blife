'use client'

import { MarketFeed } from '@/components/home/market-feed'

export function MarketFeedContent() {
    // MarketFeed will handle everything with React Query
    return (
        <MarketFeed
            initialListings={[]}
            initialFavorites={[]}
            initialAverageLikes={0}
            currentUserId={undefined}
            initialFilters={{}}
        />
    )
}
