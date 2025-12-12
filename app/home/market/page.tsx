import { Suspense } from 'react'
import { FeedSkeleton } from '@/components/home/feed-skeleton'
import { MarketFeed, MarketSearchBar } from '@/components/home/market-feed'
import { FadeIn } from '@/components/ui/fade-in'
import { getCachedMarketListings, MarketFilters } from '@/lib/market-data'

export default async function MarketPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const q = typeof searchParams.q === 'string' ? searchParams.q : undefined
    const category = typeof searchParams.category === 'string' ? searchParams.category : undefined
    const sort = typeof searchParams.sort === 'string' ? searchParams.sort : undefined
    const minPrice = typeof searchParams.min_price === 'string' ? parseFloat(searchParams.min_price) : undefined
    const maxPrice = typeof searchParams.max_price === 'string' ? parseFloat(searchParams.max_price) : undefined
    const degree = typeof searchParams.degree === 'string' ? searchParams.degree : undefined

    const filters: MarketFilters = { q, category, sort, minPrice, maxPrice, degree }
    const initialListings = await getCachedMarketListings(filters)

    return (
        <div className="min-h-[50vh] outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Suspense fallback={<FeedSkeleton />}>
                <MarketSearchBar />
                <FadeIn>
                    <MarketFeed initialListings={initialListings} />
                </FadeIn>
            </Suspense>
        </div>
    )
}

