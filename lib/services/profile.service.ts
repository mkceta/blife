
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import type { User, Listing, Flat } from '@/lib/types'

/**
 * Service for fetching Profile data
 * Implements Edge Caching for public data
 */

/**
 * Safe user fields that can be exposed publicly.
 * Use allowlist instead of denylist to prevent accidental exposure of new sensitive fields.
 */
const SAFE_PUBLIC_USER_FIELDS = [
    'id',
    'alias_inst',
    'alias_custom',
    'avatar_url',
    'bio',
    'uni',
    'stripe_connected',
    'is_banned',
    'created_at',
] as const

export const getProfileByUsername = unstable_cache(
    async (username: string) => {
        const supabase = createAdminClient()

        // Decode URL encoding
        const decodedUsername = decodeURIComponent(username)
        let cleanUsername = decodedUsername.startsWith('@') ? decodedUsername.slice(1) : decodedUsername

        if (cleanUsername.includes('@')) {
            cleanUsername = cleanUsername.split('@')[0]
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .ilike('alias_inst', cleanUsername)
            .single()

        if (error) {
            console.error('getProfileByUsername DB Error:', error)
            return null
        }

        // SECURITY: Use allowlist pattern to sanitize data - only include explicitly safe fields
        if (data) {
            const sanitizedUser: Record<string, unknown> = {}
            for (const field of SAFE_PUBLIC_USER_FIELDS) {
                if ((data as Record<string, unknown>)[field] !== undefined) {
                    sanitizedUser[field] = (data as Record<string, unknown>)[field]
                }
            }
            return sanitizedUser as unknown as User
        }

        return null
    },
    ['profile-by-username-v5'],
    {
        revalidate: 300, // Cache for 5 minutes
        tags: ['profile'],
    }
)

export const getProfileStats = unstable_cache(
    async (userId: string) => {
        const supabase = createAdminClient()

        // Parallel counts
        const [active, sold, flats] = await Promise.all([
            supabase.from('listings').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_hidden', false).neq('status', 'sold'),
            supabase.from('listings').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_hidden', false).eq('status', 'sold'),
            supabase.from('flats').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_hidden', false)
        ])

        return {
            listings: active.count || 0,
            sold: sold.count || 0,
            flats: flats.count || 0
        }
    },
    ['profile-stats'],
    {
        revalidate: 60,
        tags: ['profile-stats']
    }
)

export const getProfileListings = unstable_cache(
    async (userId: string, page: number = 1, limit: number = 20, status: 'active' | 'sold' = 'active') => {
        const supabase = createAdminClient()
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('listings')
            .select('*')
            .eq('user_id', userId)
            .eq('is_hidden', false)

        if (status === 'sold') {
            query = query.eq('status', 'sold')
        } else {
            query = query.neq('status', 'sold')
        }

        const { data } = await query
            .range(from, to)
            .order('created_at', { ascending: false })

        return (data || []) as Listing[]
    },
    ['profile-listings-v4'],
    {
        revalidate: 60, // Cache for 1 minute
        tags: ['listings'],
    }
)

export const getProfileFlats = unstable_cache(
    async (userId: string, page: number = 1, limit: number = 20) => {
        const supabase = createAdminClient()
        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data } = await supabase
            .from('flats')
            .select('*')
            .eq('user_id', userId)
            .eq('is_hidden', false)
            .range(from, to)
            .order('created_at', { ascending: false })

        return (data || []) as Flat[]
    },
    ['profile-flats-v3'],
    {
        revalidate: 60, // Cache for 1 minute
        tags: ['flats'],
    }
)

// Non-cached version for private profile (requires auth)
export const getMyProfileFullData = async (userId: string) => {
    const supabase = await createServerClient()

    // Parallel fetch for private dashboard
    const [profileResponse, stripeResponse, activeListings, soldListings, flats] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('stripe_accounts').select('charges_enabled').eq('user_id', userId).single(),
        supabase.from('listings').select('*').eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('listings').select('*').eq('user_id', userId).eq('status', 'sold').order('created_at', { ascending: false }),
        supabase.from('flats').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ])

    const profile = profileResponse.data as User

    if (profile) {
        // Manually inject stripe status to avoid flicker
        profile.stripe_connected = !!stripeResponse.data?.charges_enabled
    }

    return {
        profile: profile,
        activeListings: (activeListings.data || []) as Listing[],
        soldListings: (soldListings.data || []) as Listing[],
        flats: (flats.data || []) as Flat[]
    }
}
