
import { createCacheClient } from '@/lib/supabase-cache'
import { unstable_cache } from 'next/cache'

// Use a separate client for cached requests to avoid cookie/header dependency errors in cache
const supabase = createCacheClient()

export type MarketFilters = {
    q?: string
    category?: string
    degree?: string
    minPrice?: number
    maxPrice?: number
    sort?: string
    size?: string
}

const getListings = async (filters: MarketFilters) => {
    let query = supabase
        .from('listings')
        .select('id, title, price_cents, photos, created_at, status, user_id, favorites_count, brand, size, condition, is_hidden, category, user:users!listings_user_id_fkey(alias_inst, rating_avg, degree, avatar_url)')
        .eq('is_hidden', false)
        .neq('status', 'sold')

    if (filters.q) {
        query = query.ilike('title', `%${filters.q}%`)
    }
    if (filters.category) {
        query = query.eq('category', filters.category)
    }
    if (filters.degree) {
        // Warning: Filtering by joined relation property usually requires !inner or specific setup.
        // If this fails, we might need to filter in-memory for cached data, or align Supabase types.
        query = query.eq('user.degree', filters.degree)
    }
    if (filters.minPrice) {
        query = query.gte('price_cents', filters.minPrice * 100)
    }
    if (filters.maxPrice) {
        query = query.lte('price_cents', filters.maxPrice * 100)
    }
    if (filters.size) {
        query = query.eq('size', filters.size)
    }

    // Sort
    switch (filters.sort) {
        case 'oldest':
            query = query.order('created_at', { ascending: true })
            break
        case 'price_asc':
            query = query.order('price_cents', { ascending: true })
            break
        case 'price_desc':
            query = query.order('price_cents', { ascending: false })
            break
        case 'most_liked':
            query = query.order('favorites_count', { ascending: false })
            break
        default:
            // Newest / Discovery
            // Increased limit to support better client-side filtering
            query = query.order('created_at', { ascending: false }).limit(100)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching cached listings:', error)
        return []
    }

    return data || []
}

// We treat "discovery" (no filters) specially to cache it longer or globally.
// Filtered queries might be too diverse to cache effectively forever, but we can cache them for short time.
export const getCachedMarketListings = unstable_cache(
    async (filters: MarketFilters) => {
        return getListings(filters)
    },
    ['market-listings'], // Base tag
    {
        revalidate: 60, // Cache for 1 miunte
        tags: ['market-listings']
    }
)
