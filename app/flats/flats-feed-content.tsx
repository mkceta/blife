import { FlatsFeed } from '@/components/home/flats-feed'
import { getCachedFlats, FlatsFilters } from '@/lib/flats-data'
import { createClient } from '@/lib/supabase-server'
import { FlatsSearchBar } from '@/components/home/flats-search-bar'
import { FadeIn } from '@/components/ui/fade-in'

export async function FlatsFeedContent({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams

    const filters: FlatsFilters = {
        q: params.q as string || undefined,
        min_rent: params.min_rent as string || undefined,
        max_rent: params.max_rent as string || undefined,
        min_rooms: params.min_rooms as string || undefined,
        min_baths: params.min_baths as string || undefined,
        min_area: params.min_area as string || undefined,
        max_area: params.max_area as string || undefined,
        location_area: params.location_area as string || undefined,
        sort: params.sort as string || undefined,
    }

    const supabase = await createClient()

    // Fetch data in parallel
    const [
        { data: { user } },
        initialFlats
    ] = await Promise.all([
        supabase.auth.getUser(),
        getCachedFlats(filters)
    ])

    return (
        <>
            <FlatsSearchBar flats={initialFlats} />
            <FadeIn>
                <FlatsFeed initialFlats={initialFlats} currentUserId={user?.id} />
            </FadeIn>
        </>
    )
}
