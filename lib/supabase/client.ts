import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for Client Components.
 * 
 * Uses a singleton pattern that survives HMR in development.
 * The client is stored on the window object to persist across module reloads.
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 * 
 * export function MyComponent() {
 *   const supabase = createClient()
 *   // Same instance returned every time
 * }
 * ```
 * 
 * @important Use this ONLY in client components (files with 'use client')
 * Do NOT use in server components or server actions - use server.ts instead
 */

// Symbol to store the client on window (avoids collisions)
const SUPABASE_CLIENT_KEY = '__supabase_client__'

// Type for the client
type SupabaseClient = ReturnType<typeof createBrowserClient>

// Extend window type
declare global {
    interface Window {
        [SUPABASE_CLIENT_KEY]?: SupabaseClient
    }
}

export const createClient = (): SupabaseClient => {
    // Only run on client
    if (typeof window === 'undefined') {
        // Return a new instance for SSR (won't be used for mutations)
        return createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }

    // Check if we already have a client on window
    if (window[SUPABASE_CLIENT_KEY]) {
        return window[SUPABASE_CLIENT_KEY]
    }

    // Create and store the client
    const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    window[SUPABASE_CLIENT_KEY] = client
    return client
}
