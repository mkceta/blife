'use client'

import { createContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getUnreadCount } from '@/app/notifications/actions'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

export interface Notification {
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

interface NotificationsContextType {
    notifications: Notification[]
    unreadCount: number
    loading: boolean
}

export const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        let channel: RealtimeChannel

        async function setupRealtimeSubscription() {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            const { count } = await getUnreadCount()
            setUnreadCount(count)

            const { data: unreadData } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .eq('read', false)
                .order('created_at', { ascending: false })
                .limit(50)

            if (unreadData) {
                setNotifications(unreadData)
            }

            setLoading(false)

            // Use a stable channel name per user to allow connection coalescing if supported,
            // or at least easier debugging. Unique per tab is default behavior if topic is same?
            // Actually, Supabase counts connections by WebSocket.
            // But sharing the channel name `notifications:userId` is cleaner.
            const channelName = `notifications:${user.id}`
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
                        const newNotification = payload.new as Notification
                        setNotifications((prev) => [newNotification, ...prev])
                        setUnreadCount((prev) => prev + 1)

                        if (Capacitor.isNativePlatform()) {
                            try {
                                await LocalNotifications.schedule({
                                    notifications: [
                                        {
                                            title: 'BLife',
                                            body: newNotification.message || 'Tienes una nueva notificación',
                                            id: Date.now(),
                                            schedule: { at: new Date(Date.now() + 100) },
                                            sound: undefined,
                                            attachments: undefined,
                                            actionTypeId: "",
                                            extra: { url: newNotification.link }
                                        }
                                    ]
                                })
                            } catch (e) {
                                console.error('Error scheduling local notification:', e)
                            }
                        }
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
                        const updatedNotification = payload.new as Notification

                        setNotifications((prev) =>
                            prev.map((n) =>
                                n.id === updatedNotification.id ? updatedNotification : n
                            )
                        )

                        const { count } = await getUnreadCount()
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
                        const deletedId = payload.old.id
                        setNotifications((prev) => prev.filter((n) => n.id !== deletedId))
                        const { count } = await getUnreadCount()
                        setUnreadCount(count)
                    }
                )
                .subscribe()
        }

        setupRealtimeSubscription()

        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [])

    return (
        <NotificationsContext.Provider value={{ notifications, unreadCount, loading }}>
            {children}
        </NotificationsContext.Provider>
    )
}
