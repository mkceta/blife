'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { MarketFeed } from '@/components/home/market-feed'
import { FlatsFeed } from '@/components/home/flats-feed'
import { FeedSkeleton } from '@/components/home/feed-skeleton'
import { HomeClient } from '@/components/home/home-client'

function HomeContent() {
    const searchParams = useSearchParams()
    const activeTab = searchParams.get('tab') || 'market'

    return (
        <HomeClient
            initialTab={activeTab}
            marketFeed={
                <Suspense fallback={<FeedSkeleton />}>
                    <MarketFeed />
                </Suspense>
            }
            flatsFeed={
                <Suspense fallback={<FeedSkeleton />}>
                    <FlatsFeed />
                </Suspense>
            }
        />
    )
}

export default function HomePage() {
    return (
        <Suspense fallback={<FeedSkeleton />}>
            <HomeContent />
        </Suspense>
    )
}
