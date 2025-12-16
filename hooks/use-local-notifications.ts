import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Notification } from './use-notifications-state'

/**
 * Custom hook to handle local push notifications on native platforms
 * Listens for new notifications and schedules local notifications via Capacitor
 */
export function useLocalNotifications(latestNotification: Notification | null) {
    useEffect(() => {
        // Guard clause - exit early if no notification or not native platform
        if (!latestNotification) return
        if (!Capacitor.isNativePlatform()) return

        // At this point, latestNotification is guaranteed to be non-null
        async function scheduleLocalNotification() {
            try {
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: 'BLife',
                            body: latestNotification!.message || 'Tienes una nueva notificación',
                            id: Date.now(),
                            schedule: { at: new Date(Date.now() + 100) },
                            sound: undefined,
                            attachments: undefined,
                            actionTypeId: '',
                            extra: { url: latestNotification!.link }
                        }
                    ]
                })
            } catch (error) {
                console.error('Error scheduling local notification:', error)
            }
        }

        scheduleLocalNotification()
    }, [latestNotification])
}
