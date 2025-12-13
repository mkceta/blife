'use client'

import { useContext } from 'react'
import { NotificationsContext } from '@/components/providers/notifications-provider'

export { type Notification } from '@/components/providers/notifications-provider'

export function useNotifications() {
    const context = useContext(NotificationsContext)
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider')
    }
    return context
}