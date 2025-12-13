import { Suspense } from 'react'
import { FeedSkeleton } from '@/components/home/feed-skeleton'
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
            <div className="min-h-[50vh] outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <MarketSearchBar />
                <FadeIn>
                    <Suspense fallback={<FeedSkeleton />}>
                        <MarketFeedContent searchParams={searchParams} />
                    </Suspense>
                </FadeIn>
            </div>
        </ProductFeedLayout>
    )
}

