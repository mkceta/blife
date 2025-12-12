import { Suspense } from 'react'
import { FeedSkeleton } from '@/components/home/feed-skeleton'
import { MarketFeed, MarketSearchBar } from '@/components/home/market-feed'
import { FadeIn } from '@/components/ui/fade-in'
import { getCachedMarketListings, MarketFilters } from '@/lib/market-data'

import { createClient } from '@/lib/supabase-server'

export default async function MarketPage({
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

    // Parallelize data fetching
    const supabase = await createClient()
    const listingsPromise = getCachedMarketListings(filters)
    const userPromise = supabase.auth.getUser()
    const avgLikesPromise = supabase.rpc('get_average_listing_favorites')

    const [initialListingsRaw, { data: { user } }, { data: avgLikes }] = await Promise.all([
        listingsPromise,
        userPromise,
        avgLikesPromise
    ])

    // Filter out own listings from feed (they appear in Profile)
    const filteredListings = user ? initialListingsRaw.filter(l => l.user_id !== user.id) : initialListingsRaw

    // Server-side shuffling for "Discovery" mode (no specific sort) to prevent client-side hydration mismatch/flicker
    let initialListings = [...filteredListings]
    if (!sort || sort === 'recommended') {
        for (let i = initialListings.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [initialListings[i], initialListings[j]] = [initialListings[j], initialListings[i]];
        }
    }

    let initialFavorites: string[] = []
    if (user && initialListings.length > 0) {
        const { data: favorites } = await supabase
            .from('favorites')
            .select('listing_id')
            .eq('user_id', user.id)
            .in('listing_id', initialListings.map(l => l.id))

        if (favorites) {
            initialFavorites = favorites.map((f: any) => f.listing_id)
        }
    }

    return (
        <div className="min-h-[50vh] outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Suspense fallback={<FeedSkeleton />}>
                <MarketSearchBar />
                <FadeIn>
                    <MarketFeed
                        initialListings={initialListings}
                        initialFavorites={initialFavorites}
                        initialAverageLikes={avgLikes || 0}
                        currentUserId={user?.id}
                    />
                </FadeIn>
            </Suspense>
        </div>
    )
}

