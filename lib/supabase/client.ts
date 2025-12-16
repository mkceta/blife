import { createBrowserClient } from '@supabase/ssr'

/**
 * Singleton Supabase client for Client Components.
 * 
 * The client is created once and reused across all components,
 * avoiding the overhead of creating new instances on every render.
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

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
    if (clientInstance) {
        return clientInstance
    }

    clientInstance = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    return clientInstance
}

