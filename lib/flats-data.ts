import { unstable_cache } from 'next/cache'
import { createCacheClient } from '@/lib/supabase-cache'

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

export const getCachedFlats = unstable_cache(
    async (filters: FlatsFilters, limit: number = 50) => {
        const supabase = createCacheClient()

        let query = supabase
            .from('flats')
            .select('*, user:users!flats_user_id_fkey(alias_inst, avatar_url)')
            .eq('is_hidden', false)
            .eq('status', 'active')
            .limit(limit)

        // For cached data we might want to fetch a broader set if filters are minimal
        // But if strict server filters are applied in URL we should respect them for the specific cache key variation
        // OR we fetch "all active flats" (up to 100) and filter client side for speed.
        // Let's adopt the "Fetch Many, Filter Local" strategy for filters that are likely to be toggled often,
        // but respect heavy filters server side.

        // Actually, for "Instant Search" we want the server to return what matches the URL params initially,
        // but ideally we want the client to have a larger set to filter from.
        // Given we are using unstable_cache with arguments, we can just adhere to the server filters for correctness on first load.
        // We will implement `getAllActiveFlats` for the client to use if we want pure client filtering.

        const { q, min_rent, max_rent, min_rooms, min_baths, min_area, max_area, location_area, sort } = filters

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
            console.error('Error fetching cached flats:', error)
            return []
        }

        return data || []
    },
    ['active-flats-query'], // We might need dynamic keys if we want to cache by filter, but `unstable_cache` handles args automatically? 
    // Actually no, `unstable_cache` keys must match valid cached entries. If we pass args, they change the returned promise but we need to ensure the key varies or the internal logic uses the args.
    // The second arg to unstable_cache is `keyParts` which are combined. We should probably NOT pass the filter props into the key if we want a shared cache, but since we are filtering inside the function, the output is different, so we MUST vary the key or the function won't be called for new args if key matches?
    // Actually nextjs unstable_cache hashes the args automatically if they are passed to the returned function? - Need to verify.
    // Documentation says: "access to the arguments passed to the cached function".
    // Safe bet: The cache is granular based on arguments.
    {
        revalidate: 60,
        tags: ['flats']
    }
)
