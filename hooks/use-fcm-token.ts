import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export function useFcmToken() {
    const supabase = createClient()

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return

        const registerPush = async () => {
            try {
                // Check if we already have permission
                const status = await PushNotifications.checkPermissions()
                if (status.receive !== 'granted') return

                // Register (this triggers the 'registration' event)
                await PushNotifications.register()
            } catch (e) {
                console.error('Error registering for push:', e)
            }
        }

        // Listeners
        const addListeners = async () => {
            await PushNotifications.removeAllListeners()

            await PushNotifications.addListener('registration', async (token) => {
                console.log('Push registration success, token:', token.value)

                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    // Save token to user profile
                    const { error } = await supabase
                        .from('users')
                        .update({ fcm_token: token.value })
                        .eq('id', user.id)

                    if (error) {
                        console.error('Error saving FCM token:', error)
                    }
                }
            })

            await PushNotifications.addListener('registrationError', (error) => {
                console.error('Push registration error:', error)
            })

            await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('Push received:', notification)
                toast.info(notification.title || 'Nueva notificación', {
                    description: notification.body
                })
            })

            await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                console.log('Push action performed:', notification)
                // Handle navigation here if needed
                // const data = notification.notification.data
                // if (data.url) router.push(data.url)
            })
        }

        addListeners()
        registerPush()

        return () => {
            PushNotifications.removeAllListeners()
        }
    }, [])
}
