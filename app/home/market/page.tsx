'use client'

import { Suspense } from 'react'
import { FeedSkeleton } from '@/components/home/feed-skeleton'
import { MarketFeed, MarketSearchBar } from '@/components/home/market-feed'
import { FadeIn } from '@/components/ui/fade-in'

export default function MarketPage() {
    return (
        <div className="min-h-[50vh] outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Suspense fallback={<FeedSkeleton />}>
                <MarketSearchBar />
                <FadeIn>
                    <MarketFeed />
                </FadeIn>
            </Suspense>
        </div>
    )
}
