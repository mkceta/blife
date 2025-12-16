import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUnreadCount } from '@/app/notifications/actions'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
    id: string
    created_at: string
    user_id: string
    type: string
    title: string
    message: string
    link: string | null
    read: boolean
    data: unknown
}

interface UseNotificationsStateReturn {
    notifications: Notification[]
    unreadCount: number
    loading: boolean
    latestNotification: Notification | null
}

/**
 * Custom hook to manage notifications state
 * Handles initial fetch, real-time updates via channel, and optimistic updates
 */
export function useNotificationsState(
    channel: RealtimeChannel | null,
    userId: string | null
): UseNotificationsStateReturn {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [latestNotification, setLatestNotification] = useState<Notification | null>(null)
    const supabase = useMemo(() => createClient(), [])

    // Initial fetch
    useEffect(() => {
        async function fetchInitialNotifications() {
            if (!userId) {
                setLoading(false)
                return
            }

            try {
                // Fetch unread count
                const { count } = await getUnreadCount()
                setUnreadCount(count)

                // Fetch unread notifications
                const { data: unreadData } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('read', false)
                    .order('created_at', { ascending: false })
                    .limit(50)

                if (unreadData) {
                    setNotifications(unreadData)
                }
            } catch (error) {
                console.error('Error fetching initial notifications:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchInitialNotifications()
    }, [userId])

    // Setup realtime listeners
    useEffect(() => {
        if (!channel || !userId) return

        // INSERT handler
        const insertHandler = channel.on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            async (payload) => {
                const newNotification = payload.new as Notification
                setNotifications((prev) => [newNotification, ...prev])
                setUnreadCount((prev) => prev + 1)
                setLatestNotification(newNotification) // Trigger for local notifications
            }
        )

        // UPDATE handler
        const updateHandler = channel.on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            async (payload) => {
                const updatedNotification = payload.new as Notification

                setNotifications((prev) => {
                    const filtered = prev.filter((n) => n.id !== updatedNotification.id)
                    return [updatedNotification, ...filtered]
                })

                // Refresh unread count from server
                try {
                    const { count } = await getUnreadCount()
                    setUnreadCount(count)
                } catch (error) {
                    console.error('Error updating unread count:', error)
                }
            }
        )

        // DELETE handler
        const deleteHandler = channel.on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            async (payload) => {
                const deletedId = payload.old.id
                setNotifications((prev) => prev.filter((n) => n.id !== deletedId))

                // Refresh unread count from server
                try {
                    const { count } = await getUnreadCount()
                    setUnreadCount(count)
                } catch (error) {
                    console.error('Error updating unread count:', error)
                }
            }
        )

        // Cleanup - remove handlers when channel or userId changes
        return () => {
            // Handlers are automatically removed when channel is removed
        }
    }, [channel, userId])

    return {
        notifications,
        unreadCount,
        loading,
        latestNotification,
    }
}

