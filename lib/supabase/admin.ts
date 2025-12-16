import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase admin client with service role key.
 * 
 * @warning This client bypasses Row Level Security (RLS) policies.
 * Use ONLY when you need to perform admin operations that require elevated permissions.
 * NEVER use in client-side code or expose to the frontend.
 * 
 * @example
 * ```tsx
 * 'use server'
 * import { createAdminClient } from '@/lib/supabase/admin'
 * 
 * export async function adminOnlyAction() {
 *   const supabase = createAdminClient()
 *   // Can bypass RLS policies
 *   const { data } = await supabase.from('users').select('*')
 * }
 * ```
 * 
 * @important Common use cases:
 * - Admin dashboard operations
 * - Bulk data operations
 * - System maintenance tasks
 * - Operations that need to bypass RLS
 * 
 * @security CRITICAL: Only use in server actions or API routes
 */
export const createAdminClient = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY is not defined. ' +
            'This is required for admin operations. ' +
            'Check your .env.local file.'
        )
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}
