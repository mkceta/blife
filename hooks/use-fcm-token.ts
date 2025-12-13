import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export function useFcmToken() {
    const supabase = createClient()

    useEffect(() => {
        // Only run on native platforms (Android/iOS)
        if (!Capacitor.isNativePlatform()) {
            console.log('Not a native platform, skipping FCM registration')
            return
        }

        const registerPush = async () => {
            try {
                // Check permissions
                let permStatus = await PushNotifications.checkPermissions()

                // Request if not granted
                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions()
                }

                // Only register if granted
                if (permStatus.receive === 'granted') {
                    await PushNotifications.register()
                    console.log('Push notifications registration initiated')
                } else {
                    console.log('Push notification permission denied')
                }
            } catch (e) {
                console.error('Error in registerPush:', e)
            }
        }

        const setupListeners = async () => {
            // Remove any existing listeners first
            await PushNotifications.removeAllListeners()

            // Registration success - save token to user_devices
            await PushNotifications.addListener('registration', async (token) => {
                console.log('✅ FCM Token received:', token.value)

                try {
                    const { data: { user } } = await supabase.auth.getUser()

                    if (!user) {
                        console.warn('No user logged in, cannot save FCM token')
                        return
                    }

                    const platform = Capacitor.getPlatform() // 'android', 'ios', or 'web'

                    // Upsert to user_devices (won't duplicate thanks to UNIQUE constraint)
                    const { error } = await supabase
                        .from('user_devices')
                        .upsert({
                            user_id: user.id,
                            fcm_token: token.value,
                            platform: platform,
                            last_active: new Date().toISOString()
                        }, {
                            onConflict: 'user_id,fcm_token' // Update if exists
                        })

                    if (error) {
                        console.error('❌ Error saving FCM token to user_devices:', error)
                    } else {
                        console.log('✅ FCM token saved to user_devices')
                    }
                } catch (err) {
                    console.error('❌ Exception saving FCM token:', err)
                }
            })

            // Registration error
            await PushNotifications.addListener('registrationError', (error) => {
                console.error('❌ Push registration error:', error)
            })

            // Notification received while app is in foreground
            await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('📬 Push notification received (foreground):', notification)

                // Show toast in-app
                toast.info(notification.title || 'Nueva notificación', {
                    description: notification.body,
                    duration: 5000
                })
            })

            // Notification tapped (app was in background/closed)
            await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                console.log('👆 Push notification action performed:', action)

                const data = action.notification.data

                // Handle deep linking
                if (data?.url) {
                    console.log('Navigating to:', data.url)
                    // Use window.location for navigation in Capacitor
                    if (typeof window !== 'undefined') {
                        window.location.href = data.url
                    }
                }
            })
        }

        // Initialize
        setupListeners()
        registerPush()

        // Cleanup on unmount
        return () => {
            PushNotifications.removeAllListeners()
        }
    }, []) // Empty deps - only run once on mount

    // Update last_active periodically (every 5 minutes when app is active)
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return

        const updateActivity = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Update last_active for all this user's devices
            await supabase
                .from('user_devices')
                .update({ last_active: new Date().toISOString() })
                .eq('user_id', user.id)
        }

        const interval = setInterval(updateActivity, 5 * 60 * 1000) // 5 minutes

        return () => clearInterval(interval)
    }, [supabase])
}
