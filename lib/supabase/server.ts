import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for use in Server Components and Server Actions.
 * 
 * @example Server Component
 * ```tsx
 * import { createServerClient } from '@/lib/supabase/server'
 * 
 * export default async function MyPage() {
 *   const supabase = await createServerClient()
 *   const { data } = await supabase.from('listings').select('*')
 *   return <div>...</div>
 * }
 * ```
 * 
 * @example Server Action
 * ```tsx
 * 'use server'
 * import { createServerClient } from '@/lib/supabase/server'
 * 
 * export async function myAction() {
 *   const supabase = await createServerClient()
 *   // ...
 * }
 * ```
 * 
 * @important Use this in server components and server actions
 * Do NOT use in client components - use client.ts instead
 */
export const createServerClient = async () => {
    const cookieStore = await cookies()

    return createSupabaseServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

