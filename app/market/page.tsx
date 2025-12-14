'use client'

import { MarketSearchBar } from '@/components/home/market-search-bar'
import ProductFeedLayout from '@/app/product-feed-layout'
import { MarketFeedContent } from './market-feed-content'

export default function MarketPage() {
    return (
        <ProductFeedLayout>
            <div className="min-h-[50vh] outline-none">
                <MarketSearchBar />
                <MarketFeedContent />
            </div>
        </ProductFeedLayout>
    )
}

