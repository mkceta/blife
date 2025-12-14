export const dynamic = 'force-dynamic'
import { MarketSearchBar } from '@/components/home/market-search-bar'
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
                <MarketFeedContent searchParams={searchParams} />
            </div>
        </ProductFeedLayout>
    )
}

