
import { createClient } from '@supabase/supabase-js'

// Simple client for cached operations that doesn't use cookies/headers
// This is safe to use inside unstable_cache
export const createCacheClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
