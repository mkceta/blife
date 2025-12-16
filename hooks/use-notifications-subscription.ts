import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type SubscriptionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'no-user'

interface UseNotificationsSubscriptionReturn {
    channel: RealtimeChannel | null
    status: SubscriptionStatus
    error: Error | null
    userId: string | null
}

/**
 * Custom hook to manage Supabase Realtime subscription for notifications
 * Handles connection, reconnection with exponential backoff, and cleanup
 */
export function useNotificationsSubscription(): UseNotificationsSubscriptionReturn {
    const [channel, setChannel] = useState<RealtimeChannel | null>(null)
    const [status, setStatus] = useState<SubscriptionStatus>('disconnected')
    const [error, setError] = useState<Error | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    // Memoize supabase client to prevent recreation on every render
    const supabase = useMemo(() => createClient(), [])

    const retryCount = useRef(0)
    const maxRetries = 3 // Reduced from 5 - fail faster
    const isMounted = useRef(true)
    const hasTriedOnce = useRef(false)

    useEffect(() => {
        let currentChannel: RealtimeChannel | null = null
        let retryTimeout: NodeJS.Timeout | null = null
        isMounted.current = true

        // Reset retry count on mount (handles React Strict Mode double-mount)
        retryCount.current = 0
        hasTriedOnce.current = false

        async function setupSubscription() {
            // Don't proceed if component unmounted
            if (!isMounted.current) return

            try {
                // Only set connecting status on first try to avoid flicker
                if (!hasTriedOnce.current) {
                    setStatus('connecting')
                    hasTriedOnce.current = true
                }

                // Get current user
                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError) {
                    // Auth error - don't retry, just mark as no-user
                    if (isMounted.current) {
                        setStatus('no-user')
                        setUserId(null)
                    }
                    return
                }

                if (!user) {
                    // No user logged in - this is not an error, just mark status and don't retry
                    if (isMounted.current) {
                        setStatus('no-user')
                        setUserId(null)
                    }
                    return
                }

                // Don't proceed if component unmounted during async
                if (!isMounted.current) return

                setUserId(user.id)

                // Create channel with unique name per user
                const channelName = `notifications:${user.id}`
                currentChannel = supabase.channel(channelName)

                // Subscribe to channel
                currentChannel?.subscribe((subscribeStatus) => {
                    // Don't update state if unmounted
                    if (!isMounted.current) return

                    if (subscribeStatus === 'SUBSCRIBED') {
                        setStatus('connected')
                        setError(null)
                        retryCount.current = 0 // Reset retry count on successful connection
                    } else if (subscribeStatus === 'CHANNEL_ERROR') {
                        console.warn('Notifications channel error - realtime may be unavailable')
                        setStatus('error')
                        setError(new Error('Channel subscription error'))
                        // Only retry for channel errors, not aggressively
                        if (retryCount.current < maxRetries) {
                            scheduleRetry()
                        }
                    } else if (subscribeStatus === 'TIMED_OUT') {
                        console.warn('Notifications channel timed out')
                        setStatus('error')
                        setError(new Error('Channel subscription timed out'))
                        // Don't retry on timeout - server may be overloaded
                    } else if (subscribeStatus === 'CLOSED') {
                        // Channel closed - only retry if mounted and not during cleanup
                        if (isMounted.current && retryCount.current < maxRetries) {
                            setStatus('disconnected')
                            scheduleRetry()
                        }
                    }
                })

                setChannel(currentChannel)
            } catch (err) {
                if (!isMounted.current) return
                console.warn('Notifications subscription error:', err)
                setStatus('error')
                setError(err instanceof Error ? err : new Error('Unknown error'))
                // Don't retry on exceptions - something is fundamentally wrong
            }
        }

        function scheduleRetry() {
            // Don't retry if unmounted or max retries reached
            if (!isMounted.current) return

            if (retryCount.current >= maxRetries) {
                // Log as info, not error - this is expected in some scenarios
                console.info('Notifications subscription unavailable - will retry on next navigation')
                return
            }

            // Exponential backoff: 2s, 4s, 8s
            const delay = Math.min(2000 * Math.pow(2, retryCount.current), 8000)
            retryCount.current++

            retryTimeout = setTimeout(() => {
                if (isMounted.current) {
                    setupSubscription()
                }
            }, delay)
        }

        setupSubscription()

        // Cleanup
        return () => {
            isMounted.current = false
            if (retryTimeout) {
                clearTimeout(retryTimeout)
            }
            if (currentChannel) {
                supabase.removeChannel(currentChannel)
            }
        }
    }, [supabase])

    return { channel, status, error, userId }
}
