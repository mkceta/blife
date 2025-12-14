'use client'

import { MarketFeed } from '@/components/home/market-feed'

export function MarketFeedContent({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    // Just pass through - MarketFeed will handle everything with React Query
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
