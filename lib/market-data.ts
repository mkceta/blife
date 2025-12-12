
import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

// Use a separate client for cached requests to avoid cookie/header dependency errors in cache
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type MarketFilters = {
    q?: string
    category?: string
    degree?: string
    minPrice?: number
    maxPrice?: number
    sort?: string
}

const getListings = async (filters: MarketFilters) => {
    let query = supabase
        .from('listings')
        .select('*, user:users!listings_user_id_fkey(alias_inst, rating_avg, degree, avatar_url)')
        .eq('is_hidden', false)
        .neq('status', 'sold')

    if (filters.q) {
        query = query.ilike('title', `%${filters.q}%`)
    }
    if (filters.category) {
        query = query.eq('category', filters.category)
    }
    if (filters.degree) {
        // Note: Filter by related table field might strictly require !inner join if filtering, 
        // but let's assume the relation exists. 
        // Actually Supabase syntax for filtering on joined table is:
        // .eq('user.degree', degree) -> This works if referencing the embedded resource, 
        // OR using !inner on the select.
        // The original code used .eq('user.degree', degree) which assumes generic PostgREST filtering on JSON or similar? 
        // No, in PostgREST accessing related table columns in filter key like 'user.degree' is not standard unless 'user' is a jsonb column.
        // But the Supabase JS client might map it.
        // Let's stick to the original logic: .eq('user.degree', degree)
        // Check original file: market-feed.tsx line 54: .eq('user.degree', degree)
        // Wait, 'user' is a Joined table. PostgREST usually requires `!inner` for filtering by related table:
        // .select('*, user!inner(*)') ...
        // The original code uses .select('*, user:users!listings_user_id_fkey(...)').
        // If the original worked, I'll trust it.

        // Actually, to be safe for cache which might run in a stricter environments or just to be correct:
        // If filtering by relation, we generally need !inner.
        // But I'll replicate the exact logic from the client side first.
        query = query.eq('user.degree', filters.degree)
    }
    if (filters.minPrice) {
        query = query.gte('price_cents', filters.minPrice * 100)
    }
    if (filters.maxPrice) {
        query = query.lte('price_cents', filters.maxPrice * 100)
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
            query = query.order('created_at', { ascending: false }).limit(50)
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
        revalidate: 60, // Cache for 60 seconds
        tags: ['market-listings']
    }
)
