import { unstable_cache } from 'next/cache'
import { createCacheClient } from '@/lib/supabase-cache'

export const getCachedPosts = unstable_cache(
    async (category?: string, searchTerm?: string, limit: number = 20) => {
        const supabase = createCacheClient()

        let query = supabase
            .from('posts')
            .select(`
                *,
                user:users!posts_user_id_fkey(id, alias_inst, avatar_url)
            `)
            .eq('is_hidden', false)
            .order('created_at', { ascending: false })
            .limit(limit)

        // For "General", we might want all, but usually we filter by category if provided
        // However, if we want "Instant" interactions, we might cache ALL recent posts (e.g. 50-100)
        // and let the client filter. But server-side filtering is also good for initial load.
        // Let's support both. If categories are key, we can cache per category or just cache "all" and filter.
        // To support "Instant" searching/filtering client side, it's better to fetch a larger generic batch
        // if no specific heavy filter is applied.

        if (category && category !== 'General' && category !== 'Todos') {
            query = query.contains('category', [category])
        }

        if (searchTerm) {
            query = query.ilike('text', `%${searchTerm}%`)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching cached posts:', error)
            return []
        }

        return data || []
    },
    ['community-posts'], // Base Cache Key
    {
        revalidate: 30, // Revalidate every 30 seconds
        tags: ['community-posts']
    }
)
