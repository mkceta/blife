
import ProductFeedLayout from '@/app/product-feed-layout'
import { FlatsFeedContent } from './flats-feed-content'

export default function FlatsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    return (
        <ProductFeedLayout>
            <div className="min-h-[50vh] outline-none">
                <FlatsFeedContent searchParams={searchParams} />
            </div>
        </ProductFeedLayout>
    )
}
