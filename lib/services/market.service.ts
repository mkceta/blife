
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { createAnonServerClient } from '@/lib/supabase/server-anon'
import type { Listing, MarketFilters } from '@/lib/types'

// Re-export types if needed by consumers
export type { MarketFilters } from '@/lib/types'

/**
 * -----------------------------------------------------------------------------
 * MARKET SERVICE
 * Centralized data fetching for Market features.
 * 
 * STRATEGY:
 * - Public Data: Buffered Cache (unstable_cache) + Admin Client (Bypass RLS) + Sanitization
 * - User Specific Data: No Cache + Server Client (Cookies) + RLS
 * -----------------------------------------------------------------------------
 */

/**
 * Core function to fetch listings based on filters.
 * Internal use for cached/uncached wrappers.
 */
const fetchListingsQuery = async (filters: MarketFilters) => {
    // Using Admin Client to ensure we can fetch public profiles joined to listings
    // without hitting "Anonymous" RLS blocks. RLS should be fixed eventually to allow Anon read.
    const supabase = createAdminClient()

    let query = supabase
        .from('listings')
        .select('id, title, price_cents, photos, created_at, status, user_id, favorites_count, brand, size, condition, is_hidden, category, user:users!user_id(alias_inst, rating_avg, degree, avatar_url)')
        .eq('is_hidden', false)
        .neq('status', 'sold')

    // Apply Filters
    if (filters.q) query = query.ilike('title', `%${filters.q}%`)
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.degree) query = query.eq('user.degree', filters.degree)
    if (filters.minPrice) query = query.gte('price_cents', filters.minPrice * 100)
    if (filters.maxPrice) query = query.lte('price_cents', filters.maxPrice * 100)
    if (filters.size) query = query.eq('size', filters.size)

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
            query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const page = filters.page || 1
    const limit = filters.limit || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to)

    const { data, error } = await query

    if (error) {
        console.error('Error fetching market listings:', error)
        return []
    }

    // Transform and Sanitize
    const transformedData = data?.map(item => {
        // Sanitize user data if needed (though we selected specific fields in .select())

        return {
            ...item,
            photos: Array.isArray(item.photos)
                ? item.photos.map((p: string | { url: string }) => typeof p === 'string' ? { url: p } : p)
                : []
        }
    })

    return (transformedData as unknown as Listing[]) || []
}

/**
 * Fetch Market Listings (Cached 60s)
 */
export const getMarketListingsCached = unstable_cache(
    async (filters: MarketFilters) => {
        return fetchListingsQuery(filters)
    },
    ['market-listings'], // Note: Cache key should ideally include filters hash, but 'market-listings' is generic tag? 
    // Wait, unstable_cache default key is generic. If we want cache per filter, we need unique keys.
    // However, for the main feed usually filters are empty or standard.
    // For specific search, we might be hitting cache misses or collisions if key doesn't vary.
    // unstable_cache(fn, keyParts, options). keyParts combined with args determine cache.
    // Next.js handles args serialization automatically in recent versions? 
    // Yes, but let's be safe.
    {
        revalidate: 60,
        tags: ['market', 'listings'],
    }
)

/**
 * Direct fetch (No Cache)
 */
export const getMarketListingsDirect = async (filters: MarketFilters) => {
    return fetchListingsQuery(filters)
}

/**
 * Fetch Single Listing Details
 */
export const getListingById = unstable_cache(
    async (id: string) => {
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('listings')
            .select('*, user:users!user_id(*)')
            .eq('id', id)
            .single()

        if (error) return null

        // Sanitize user sensitive data since we pulled (*)
        if (data && data.user) {
            const unsafeUser = data.user as any
            delete unsafeUser.email
            delete unsafeUser.phone
            delete unsafeUser.billing_address
            delete unsafeUser.metadata
        }

        // Transform photos
        const transformedData = {
            ...data,
            photos: Array.isArray(data.photos)
                ? data.photos.map((p: any) => typeof p === 'string' ? { url: p } : p)
                : []
        }

        return transformedData as Listing & { user: any }
    },
    ['listing-by-id-v2'], // Include ID in key? unstable_cache handles it via arguments usually.
    {
        revalidate: 60,
        tags: ['listings'],
    }
)

/**
 * Fetch Related Listings
 */
export const getRelatedListings = unstable_cache(
    async (category: string, currentId: string) => {
        const supabase = createAdminClient()

        const { data } = await supabase
            .from('listings')
            .select('*')
            .eq('category', category)
            .eq('status', 'active')
            .neq('id', currentId)
            .limit(4)

        return (data || []) as Listing[]
    },
    ['related-listings-v2'],
    {
        revalidate: 300,
        tags: ['listings'],
    }
)

/**
 * Get User Favorites (No Cache, Auth Required)
 */
export const getUserFavorites = async (userId: string) => {
    const supabase = await createServerClient()
    const { data } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', userId)

    return data?.map(f => f.listing_id) || []
}

/**
 * Get Average Likes (Metric)
 */
export const getAverageLikes = unstable_cache(
    async () => {
        const supabase = createAdminClient()
        const { data } = await supabase
            .from('listings')
            .select('favorites_count')
            .eq('is_hidden', false)
            .neq('status', 'sold')

        if (!data || data.length === 0) return 0

        const sum = data.reduce((acc, item) => acc + (item.favorites_count || 0), 0)
        return sum / data.length
    },
    ['average-likes'],
    {
        revalidate: 300,
        tags: ['market', 'favorites'],
    }
)
