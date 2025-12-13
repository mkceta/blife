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

    // We don't fetch listings here to avoid blocking execution.
    // We delegate fetching to the client component.

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <>
            {/* Note: FlatsMenuBar / SearchBar is inside the Suspense boundary but currently renders fast as we don't query data */}
            {/* We pass empty flats to SearchBar, assuming it handles it gracefully or fetches distinct locations internally if needed? */}
            {/* Actually FlatsSearchBar just uses `flats` to calculate unique locations for filter dropdown. 
                 If we pass empty, the location filter might be empty initially. 
                 This is a trade-off. We might want to fetch lightweight locations separately or just let it be empty until loaded?
                 Or we fetch ONLY locations here? Locations is fast.
            */}

            <FlatsSearchBar flats={[]} />
            <FadeIn>
                <FlatsFeed initialFlats={[]} currentUserId={user?.id} />
            </FadeIn>
        </>
    )
}
