import { MarketSearchBar } from '@/components/home/market-search-bar'
import ProductFeedLayout from '@/app/product-feed-layout'
// import { MarketFeedContent } from './market-feed-content' // Static import removed
import { Suspense } from 'react'
import dynamicImport from 'next/dynamic'
import { FeedSkeleton } from '@/components/home/feed-skeleton'

const MarketFeedContent = dynamicImport(
    () => import('./market-feed-content').then(mod => mod.MarketFeedContent),
    {
        loading: () => <FeedSkeleton />,
    }
)

// Prevent server-side rendering - all data comes from React Query cache
export const dynamic = 'force-static'

export default function MarketPage() {
    // No server-side params waiting - strictly static shell

    return (
        <ProductFeedLayout>
            <div className="min-h-[50vh] outline-none">
                <Suspense fallback={<div className="h-32 bg-background/95 backdrop-blur-md" />}>
                    <MarketSearchBar />
                </Suspense>
                <MarketFeedContent />
            </div>
        </ProductFeedLayout>
    )
}
