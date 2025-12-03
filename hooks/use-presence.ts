'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export function usePresence() {
    useEffect(() => {
        const supabase = createClient()

        async function update() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    return
                }

                // Try RPC first
                const { error } = await supabase.rpc('update_presence')

                if (error) {
                    console.error('usePresence: RPC error', error)
                    // Fallback to direct update
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ last_seen: new Date().toISOString() })
                        .eq('id', user.id)

                    if (updateError) console.error('usePresence: Direct update error', updateError)
                }
            } catch (e) {
                console.error('usePresence: Exception', e)
            }
        }

        // Update immediately
        update()

        // Update every 1 minute
        const interval = setInterval(update, 60 * 1000)

        // Update on window focus
        const handleFocus = () => update()
        window.addEventListener('focus', handleFocus)

        return () => {
            clearInterval(interval)
            window.removeEventListener('focus', handleFocus)
        }
    }, [])
}
