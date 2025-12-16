
import { unstable_cache } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type CommunityFilters = {
    category?: string
    q?: string
    page?: number
    limit?: number
}

/**
 * -----------------------------------------------------------------------------
 * COMMUNITY SERVICE
 * Centralized data fetching for Community features.
 * -----------------------------------------------------------------------------
 */

/**
 * Core function to fetch posts based on filters.
 */
const fetchPostsQuery = async (filters: CommunityFilters) => {
    const supabase = createAdminClient()

    let query = supabase
        .from('posts')
        .select(`
            *,
            user:users!user_id(id, alias_inst, avatar_url)
        `)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })

    // Pagination
    const page = filters.page || 1
    const limit = filters.limit || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to)

    // Filter by category (exclude General/Todos which show all)
    if (filters.category && filters.category !== 'General' && filters.category !== 'Todos') {
        query = query.contains('category', [filters.category])
    }

    // Search filter
    if (filters.q) {
        query = query.ilike('text', `%${filters.q}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching community posts:', error)
        return []
    }

    return data || []
}

/**
 * Fetch Community Posts (Cached 30s)
 * Using Admin Client avoids RLS anon issues, but sanitization relies on query select fields.
 */
export const getCommunityPostsCached = unstable_cache(
    async (filters: CommunityFilters) => {
        return fetchPostsQuery(filters)
    },
    ['community-posts-v3'],
    {
        revalidate: 30,
        tags: ['community', 'posts'],
    }
)

/**
 * Direct (non-cached) version
 */
export const getCommunityPostsDirect = async (filters: CommunityFilters) => {
    return fetchPostsQuery(filters)
}

/**
 * Get cached polls with options and votes count
 */
export const getCommunityPollsCached = unstable_cache(
    async (filters: CommunityFilters) => {
        const supabase = createAdminClient()

        let query = supabase
            .from('polls')
            .select(`
                *,
                user:users!user_id(id, alias_inst, avatar_url),
                options:poll_options(*),
                total_votes
            `)
            .order('created_at', { ascending: false })
            .limit(20)

        if (filters.category && filters.category !== 'General' && filters.category !== 'Todos') {
            query = query.contains('category', [filters.category])
        }

        if (filters.q) {
            query = query.ilike('question', `%${filters.q}%`)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching polls:', error)
            return []
        }

        return data || []
    },
    ['community-polls-v3'],
    {
        revalidate: 30,
        tags: ['community', 'polls'],
    }
)

/**
 * Get user's reaction status for a specific post
 * ⚠️ USER-SPECIFIC: Requires auth, CANNOT be cached with unstable_cache
 */
export const getUserReactions = async (userId: string, postIds: string[]) => {
    const supabase = await createServerClient()
    const { data } = await supabase
        .from('reactions')
        .select('post_id, kind')
        .eq('user_id', userId)
        .in('post_id', postIds)

    return data || []
}
