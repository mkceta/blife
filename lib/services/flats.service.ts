
import { createServerClient } from '@/lib/supabase/server'

export interface FlatsFilters {
    q?: string
    min_rent?: string
    max_rent?: string
    min_rooms?: string
    min_baths?: string
    min_area?: string
    max_area?: string
    location_area?: string
    sort?: string
}

/**
 * Service for fetching Flat Listings
 */

export const getCachedFlats = async (filters: FlatsFilters, limit: number = 50) => {
    // We remove unstable_cache for filtered queries to ensure accuracy.
    // Dynamic filtering usually has low cache hit rate anyway.
    const supabase = await createServerClient()

    let query = supabase
        .from('flats')
        .select('*, user:users!flats_user_id_fkey(alias_inst, avatar_url)')
        .eq('is_hidden', false)
        .eq('status', 'active')
        .limit(limit)

    const { q, min_rent, max_rent, min_rooms, min_baths, min_area, max_area, location_area, sort } = filters

    console.log('GET CACHED FLATS FILTERS:', filters)

    if (q) query = query.ilike('title', `%${q}%`)
    if (min_rent) query = query.gte('rent_cents', parseFloat(min_rent) * 100)
    if (max_rent) query = query.lte('rent_cents', parseFloat(max_rent) * 100)
    if (min_rooms) query = query.gte('rooms', parseInt(min_rooms))
    if (min_baths) query = query.gte('baths', parseInt(min_baths))
    if (min_area) query = query.gte('area_m2', parseFloat(min_area))
    if (max_area) query = query.lte('area_m2', parseFloat(max_area))
    if (location_area) query = query.eq('location_area', location_area)

    switch (sort) {
        case 'oldest':
            query = query.order('created_at', { ascending: true })
            break
        case 'price_asc':
            query = query.order('rent_cents', { ascending: true })
            break
        case 'price_desc':
            query = query.order('rent_cents', { ascending: false })
            break
        default:
            query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching flats:', error)
        return []
    }

    return data || []
}
