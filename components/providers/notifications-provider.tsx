'use client'

import { createContext } from 'react'
import { useNotificationsSubscription } from '@/hooks/use-notifications-subscription'
import { useNotificationsState } from '@/hooks/use-notifications-state'
import { useLocalNotifications } from '@/hooks/use-local-notifications'
import type { Notification } from '@/hooks/use-notifications-state'

// Re-export Notification type for consumers
export type { Notification }

interface NotificationsContextType {
    notifications: Notification[]
    unreadCount: number
    loading: boolean
}

export const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

/**
 * NotificationsProvider - Manages real-time notifications
 * 
 * Uses three custom hooks for separation of concerns:
 * 1. useNotificationsSubscription - Handles Realtime connection with retry logic
 * 2. useNotificationsState - Manages notification state and realtime updates
 * 3. useLocalNotifications - Handles native push notifications
 */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    // Setup Realtime subscription with auto-retry
    const { channel, userId } = useNotificationsSubscription()

    // Manage notification state with realtime updates
    const { notifications, unreadCount, loading, latestNotification } = useNotificationsState(channel, userId)

    // Handle local notifications on native platforms
    useLocalNotifications(latestNotification)

    return (
        <NotificationsContext.Provider value={{ notifications, unreadCount, loading }}>
            {children}
        </NotificationsContext.Provider>
    )
}

