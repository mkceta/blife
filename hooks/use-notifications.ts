'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getUnreadCount } from '@/app/notifications/actions'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Notification {
    id: string
    created_at: string
    user_id: string
    type: string
    title: string
    message: string
    link: string | null
    read: boolean
    data: any
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        let channel: RealtimeChannel

        async function setupRealtimeSubscription() {
            console.log('useNotifications: Setting up realtime subscription...')

            // Get current user first
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                console.log('useNotifications: No user found, skipping subscription')
                setLoading(false)
                return
            }

            console.log('useNotifications: User ID:', user.id)

            // Get initial unread count
            const { count } = await getUnreadCount()
            console.log('useNotifications: Initial unread count:', count)
            setUnreadCount(count)

            // Fetch initial unread notifications to populate state
            const { data: unreadData } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .eq('read', false)
                .order('created_at', { ascending: false })
                .limit(50)

            if (unreadData) {
                console.log('useNotifications: Setting initial notifications:', unreadData.length)
                setNotifications(unreadData)
            }

            setLoading(false)

            // Subscribe to new notifications with filter
            const channelName = `notifications-${user.id}-${Date.now()}`
            console.log('useNotifications: Creating realtime channel:', channelName)
            channel = supabase
                .channel(channelName)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    async (payload) => {
                        console.log('useNotifications: Received INSERT event:', payload)
                        const newNotification = payload.new as Notification

                        console.log('useNotifications: Adding notification for current user')
                        setNotifications((prev) => [newNotification, ...prev])
                        setUnreadCount((prev) => prev + 1)
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    async (payload) => {
                        console.log('useNotifications: Received UPDATE event:', payload)
                        const updatedNotification = payload.new as Notification

                        setNotifications((prev) =>
                            prev.map((n) =>
                                n.id === updatedNotification.id ? updatedNotification : n
                            )
                        )

                        // Update unread count
                        const { count } = await getUnreadCount()
                        console.log('useNotifications: Updated unread count:', count)
                        setUnreadCount(count)
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    async (payload) => {
                        console.log('useNotifications: Received DELETE event:', payload)
                        const deletedId = payload.old.id

                        setNotifications((prev) => prev.filter((n) => n.id !== deletedId))

                        // Update unread count
                        const { count } = await getUnreadCount()
                        setUnreadCount(count)
                    }
                )
                .subscribe((status) => {
                    console.log('useNotifications: Subscription status:', status)
                    if (status === 'CHANNEL_ERROR') {
                        console.error('useNotifications: Channel error - check Realtime configuration')
                    }
                })
        }

        setupRealtimeSubscription()

        return () => {
            console.log('useNotifications: Cleaning up subscription...')
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [])

    return {
        notifications,
        unreadCount,
        loading,
    }
}
