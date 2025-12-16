import { createClient } from '@supabase/supabase-js'

/**
 * Creates an anonymous Supabase client for PUBLIC data fetching.
 * 
 * @important This client:
 * - Does NOT use cookies
 * - Does NOT have user authentication
 * - CAN be used inside unstable_cache()
 * - Respects RLS policies (public data only)
 * 
 * @use_case
 * - Fetching public listings
 * - Fetching public posts
 * - Any data that doesn't require user authentication
 * 
 * @example Inside unstable_cache
 * ```tsx
 * import { unstable_cache } from 'next/cache'
 * import { createAnonServerClient } from '@/lib/supabase/server-anon'
 * 
 * export const getPublicListings = unstable_cache(
 *   async (filters) => {
 *     const supabase = createAnonServerClient()
 *     const { data } = await supabase
 *       .from('listings')
 *       .select('*')
 *       .eq('is_hidden', false)
 *     return data
 *   },
 *   ['public-listings'],
 *   { revalidate: 60 }
 * )
 * ```
 * 
 * @warning
 * - DO NOT use for user-specific data (favorites, messages, etc.)
 * - DO NOT use for mutations (insert, update, delete)
 * - RLS policies must be properly configured
 */
export const createAnonServerClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            }
        }
    )
}
