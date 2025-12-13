
import { FlatsFeed } from '@/components/home/flats-feed'
import { FlatsSearchBar } from '@/components/home/flats-search-bar'
import { FadeIn } from '@/components/ui/fade-in'
import { getCachedFlats, FlatsFilters } from '@/lib/flats-data'
import { createClient } from '@/lib/supabase-server'

import ProductFeedLayout from '@/app/product-feed-layout'

export default async function FlatsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams
    const filters: FlatsFilters = {
        q: typeof params.q === 'string' ? params.q : undefined,
        min_rent: typeof params.min_rent === 'string' ? params.min_rent : undefined,
        max_rent: typeof params.max_rent === 'string' ? params.max_rent : undefined,
        min_rooms: typeof params.min_rooms === 'string' ? params.min_rooms : undefined,
        min_baths: typeof params.min_baths === 'string' ? params.min_baths : undefined,
        min_area: typeof params.min_area === 'string' ? params.min_area : undefined,
        max_area: typeof params.max_area === 'string' ? params.max_area : undefined,
        location_area: typeof params.location_area === 'string' ? params.location_area : undefined,
        sort: typeof params.sort === 'string' ? params.sort : undefined,
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Server-side cached fetch
    const initialFlats = await getCachedFlats(filters)

    return (
        <ProductFeedLayout>
            <div className="min-h-[50vh] outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <FlatsSearchBar flats={initialFlats} />
                <FadeIn>
                    <FlatsFeed initialFlats={initialFlats} currentUserId={user?.id} />
                </FadeIn>
            </div>
        </ProductFeedLayout>
    )
}
