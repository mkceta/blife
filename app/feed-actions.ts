'use server'

import { getCachedMarketListings, MarketFilters } from '@/lib/market-data'
import { getCachedPosts } from '@/lib/community-data'
import { getCachedFlats, FlatsFilters } from '@/lib/flats-data'
import { createClient } from '@/lib/supabase-server'

export async function fetchMarketListingsAction(filters: MarketFilters) {
    return await getCachedMarketListings(filters)
}

export async function fetchCommunityPostsAction(category?: string, query?: string) {
    return await getCachedPosts(category, query)
}

export async function fetchFlatsAction(filters: FlatsFilters) {
    return await getCachedFlats(filters)
}

export async function fetchUserReactionsAction(postIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || postIds.length === 0) return []

    const { data: reactions } = await supabase
        .from('reactions')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds)

    return reactions ? reactions.map((r: any) => r.post_id) : []

}

export async function fetchUserFavoritesAction(listingIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || listingIds.length === 0) return []

    const { data: favorites } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', user.id)
        .in('listing_id', listingIds)

    return favorites ? favorites.map((f: any) => f.listing_id) : []
}
