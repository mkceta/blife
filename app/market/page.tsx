import { Suspense } from 'react'
import { FeedSkeleton } from '@/components/home/feed-skeleton'

export const dynamic = 'force-dynamic'
import { MarketSearchBar } from '@/components/home/market-search-bar'
import { FadeIn } from '@/components/ui/fade-in'
import ProductFeedLayout from '@/app/product-feed-layout'
import { MarketFeedContent } from './market-feed-content'

export default function MarketPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    return (
        <ProductFeedLayout>
            <div className="min-h-[50vh] outline-none">
                <MarketSearchBar />
                <Suspense fallback={<FeedSkeleton />}>
                    <MarketFeedContent searchParams={searchParams} />
                </Suspense>
            </div>
        </ProductFeedLayout>
    )
}

