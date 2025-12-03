import { createClient } from '@supabase/supabase-js'

// Note: This client should only be used in server-side contexts (API routes, Server Actions)
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client
export const createAdminClient = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
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
