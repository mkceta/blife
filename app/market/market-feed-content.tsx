import { MarketFeed } from '@/components/home/market-feed'
import { getCachedMarketListings, MarketFilters } from '@/lib/market-data'
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

    // We fetch user and global stats, but skips the heavy listings fetch to allow instant navigation
    // The client component will handle fetching or using cache.
    const userPromise = supabase.auth.getUser()
    const avgLikesPromise = supabase.rpc('get_average_listing_favorites')

    const [{ data: { user } }, { data: avgLikes }] = await Promise.all([
        userPromise,
        avgLikesPromise
    ])

    // Fetch user favorites if user exists - lightweight enough?
    // We used to fetch only for visible listings. now we don't know visible listings.
    // Let's fetch ALL user favorites IDs. It's usually small.
    // Or we leave it to the client.
    // Let's fetch all favorites here to pass as initialFavorites, so the UI is ready instantly if cache hits.

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

    // We pass EMPTY initialListings to force Client Component to use its Cache or Fetch
    // effectively skipping the Server-Side Wait.
    return (
        <MarketFeed
            initialListings={[]}
            initialFavorites={initialFavorites}
            initialAverageLikes={avgLikes || 0}
            currentUserId={user?.id}
        />
    )
}
