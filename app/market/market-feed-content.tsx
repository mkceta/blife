import { MarketFeed } from '@/components/home/market-feed'
import { getMarketListingsDirect, MarketFilters } from '@/lib/market-data'
import { createClient } from '@/lib/supabase-server'

export async function MarketFeedContent({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const q = typeof params.q === 'string' ? params.q : undefined
    const category = typeof params.category === 'string' ? params.category : undefined
    const sort = typeof params.sort === 'string' ? params.sort : undefined
    const minPrice = typeof params.min_price === 'string' ? parseFloat(params.min_price) : undefined
    const maxPrice = typeof params.max_price === 'string' ? parseFloat(params.max_price) : undefined
    const degree = typeof params.degree === 'string' ? params.degree : undefined
    const size = typeof params.size === 'string' ? params.size : undefined

    const filters: MarketFilters = { q, category, sort, minPrice, maxPrice, degree, size }

    const supabase = await createClient()

    // Fetch initial data in parallel
    const userPromise = supabase.auth.getUser()
    const avgLikesPromise = supabase.rpc('get_average_listing_favorites')
    const listingsPromise = getMarketListingsDirect(filters)

    const [{ data: { user } }, { data: avgLikes }, initialListings] = await Promise.all([
        userPromise,
        avgLikesPromise,
        listingsPromise
    ])

    // Fetch user favorites if user exists
    let initialFavorites: string[] = []
    if (user) {
        const { data: favorites } = await supabase
            .from('favorites')
            .select('listing_id')
            .eq('user_id', user.id)

        if (favorites) {
            initialFavorites = favorites.map((f: any) => f.listing_id)
        }
    }

    // Pass real initial data instead of empty array
    return (
        <MarketFeed
            initialListings={initialListings || []}
            initialFavorites={initialFavorites}
            initialAverageLikes={avgLikes || 0}
            currentUserId={user?.id}
            initialFilters={filters}
        />
    )
}
