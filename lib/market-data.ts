import { createClient } from '@/lib/supabase-server'

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
    const supabase = await createClient()

    let query = supabase
        .from('listings')
        .select('id, title, price_cents, photos, created_at, status, user_id, favorites_count, brand, size, condition, is_hidden, category, user:users!listings_user_id_fkey(alias_inst, rating_avg, degree, avatar_url)')
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
            // Limit increased to ensure client filtering has enough data if needed, though we filter server side now.
            query = query.order('created_at', { ascending: false }).limit(100)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching market listings:', error)
        return []
    }

    return data || []
}

export const getMarketListingsDirect = async (filters: MarketFilters) => {
    console.log('[MARKET-DATA] Fetching listings with filters:', JSON.stringify(filters))
    return getListings(filters)
}
