
'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useRouter } from 'next/navigation'

export function NotificationHandler() {
    const router = useRouter()

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return

        const setupListener = async () => {
            // Request permissions first if not granted, though usually done in other places
            // await LocalNotifications.requestPermissions();

            await LocalNotifications.addListener('localNotificationActionPerformed', (payload) => {
                const url = payload.notification.extra?.url
                console.log('Notification tapped:', payload, 'URL:', url)
                if (url) {
                    router.push(url)
                }
            })
        }

        setupListener()

        return () => {
            if (Capacitor.isNativePlatform()) {
                LocalNotifications.removeAllListeners()
            }
        }
    }, [router])

    return null
}
