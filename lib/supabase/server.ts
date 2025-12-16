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
    let cookieStore
    try {
        cookieStore = await cookies()
    } catch (e) {
        // Fallback for when cookies() is not available (e.g. static generation)
        // We can't really return a functional client in this case if it depends on cookies,
        // but we can return a dummy one or re-throw.
        // Given the error is "Server Components render", let's re-throw but log it.
        console.error('Error in createServerClient accessing cookies:', e)
        throw e
    }

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

