'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAggressivePrefetch } from '@/hooks/use-aggressive-prefetch'

/**
 * Aggressive Prefetch Initializer
 * Starts prefetching all pages after detecting user login
 */
export function AggressivePrefetchInit() {
    const [userId, setUserId] = useState<string | undefined>()
    const supabase = createClient()

    useEffect(() => {
        // Get current user
        supabase.auth.getUser().then(({ data: { user } }: any) => {
            if (user) {
                setUserId(user.id)
            }
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setUserId(session.user.id)
            } else if (event === 'SIGNED_OUT') {
                setUserId(undefined)
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    // Trigger aggressive prefetch when user is logged in
    useAggressivePrefetch(userId)

    return null // This component doesn't render anything
}
