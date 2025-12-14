import { MarketSearchBar } from '@/components/home/market-search-bar'
import ProductFeedLayout from '@/app/product-feed-layout'
import { MarketFeedContent } from './market-feed-content'

// Prevent server-side rendering - all data comes from React Query cache
export const dynamic = 'force-static'

export default async function MarketPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    // Await searchParams on server side (doesn't block client navigation)
    const params = await searchParams

    return (
        <ProductFeedLayout>
            <div className="min-h-[50vh] outline-none">
                <MarketSearchBar />
                <MarketFeedContent />
            </div>
        </ProductFeedLayout>
    )
}

