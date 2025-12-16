'use server'

import { getMarketListingsDirect, MarketFilters } from '@/lib/services/market.service'
import { getCommunityPostsCached, CommunityFilters } from '@/lib/services/community.service'
import { getCachedFlats, FlatsFilters } from '@/lib/services/flats.service'
import { getProfileListings, getProfileFlats } from '@/lib/services/profile.service'
import { createServerClient } from '@/lib/supabase/server'

export async function fetchMarketListingsAction(filters: MarketFilters) {
    return await getMarketListingsDirect(filters)
}

export async function fetchCommunityPostsAction(category?: string, query?: string, page: number = 1, limit: number = 20) {
    const filters: CommunityFilters = { category, q: query, page, limit }
    return await getCommunityPostsCached(filters)
}

export async function fetchFlatsAction(filters: FlatsFilters) {
    return await getCachedFlats(filters)
}

export async function fetchUserReactionsAction(postIds: string[]) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || postIds.length === 0) return []

    const { data: reactions } = await supabase
        .from('reactions')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds)

    return reactions ? reactions.map((r: { post_id: string }) => r.post_id) : []

}

export async function fetchUserFavoritesAction(listingIds: string[]) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || listingIds.length === 0) return []

    const { data: favorites } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', user.id)
        .in('listing_id', listingIds)

    return favorites ? favorites.map((f: { listing_id: string }) => f.listing_id) : []
}

export async function fetchProfileListingsAction(userId: string, page: number = 1) {
    return await getProfileListings(userId, page)
}

export async function fetchProfileFlatsAction(userId: string, page: number = 1) {
    return await getProfileFlats(userId, page)
}
