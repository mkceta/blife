
import { Suspense } from 'react'
import { FlatsSkeleton } from '@/components/home/flats-skeleton'
import ProductFeedLayout from '@/app/product-feed-layout'
import { FlatsFeedContent } from './flats-feed-content'

export default function FlatsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    return (
        <ProductFeedLayout>
            <div className="min-h-[50vh] outline-none">
                <Suspense fallback={<FlatsSkeleton />}>
                    <FlatsFeedContent searchParams={searchParams} />
                </Suspense>
            </div>
        </ProductFeedLayout>
    )
}
