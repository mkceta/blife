import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'

export function NotificationPermission() {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        checkPermission()
    }, [])

    const checkPermission = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                // Check both, but prioritize Local for the UI state as it's what we'll use for immediate feedback
                const localStatus = await LocalNotifications.checkPermissions()

                if (localStatus.display === 'granted') {
                    setPermission('granted')
                } else if (localStatus.display === 'denied') {
                    setPermission('denied')
                } else {
                    setPermission('default')
                }
            } catch (e: unknown) {
                console.error('Error checking native permissions:', e)
            }
        } else if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission)
        }
    }

    if (!mounted) return null

    const handleToggle = async (checked: boolean) => {
        if (!checked) {
            toast.info('Para desactivar las notificaciones, debes hacerlo desde la configuración del dispositivo.')
            return
        }

        if (Capacitor.isNativePlatform()) {
            try {
                // Request Local Notifications permission
                const result = await LocalNotifications.requestPermissions()

                if (result.display === 'granted') {
                    setPermission('granted')
                    toast.success('Notificaciones activadas')

                    // Schedule test notification
                    try {
                        await LocalNotifications.schedule({
                            notifications: [
                                {
                                    title: 'BLife',
                                    body: 'Has activado las notificaciones correctamente',
                                    id: 1,
                                    schedule: { at: new Date(Date.now() + 1000) }, // 1 second delay
                                    sound: undefined,
                                    attachments: undefined,
                                    actionTypeId: "",
                                    extra: null
                                }
                            ]
                        })
                    } catch (e) {
                        console.error('Error scheduling test notification:', e)
                    }

                    // Also try to register for Push if possible (best effort)
                    try {
                        const pushResult = await PushNotifications.requestPermissions()
                        if (pushResult.receive === 'granted') {
                            await PushNotifications.register()
                        }
                    } catch (e) {
                        console.log('Push registration skipped or failed')
                    }

                } else {
                    setPermission('denied')
                    toast.error('Permiso denegado. Actívalo en Ajustes.')
                }
            } catch (error: unknown) {
                console.error('Error requesting native permission:', error)
                const errorMessage = error instanceof Error ? error.message : 'No se pudieron solicitar permisos'
                toast.error(`Error: ${errorMessage}`)
            }
        } else {
            // Web logic
            if (!('Notification' in window)) {
                toast.error('Este navegador no soporta notificaciones')
                return
            }

            try {
                const result = await Notification.requestPermission()
                setPermission(result)

                if (result === 'granted') {
                    toast.success('Notificaciones activadas')
                    try {
                        new Notification('BLife', {
                            body: 'Has activado las notificaciones correctamente',
                            icon: '/icon-192.png'
                        })
                    } catch (e) {
                        console.error('Error showing test notification:', e)
                    }
                } else if (result === 'denied') {
                    toast.error('Has bloqueado las notificaciones. Actívalas en la configuración del navegador.')
                }
            } catch (error) {
                console.error('Error requesting permission:', error)
                toast.error('Error al solicitar permisos')
            }
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Notificaciones</Label>
                    <div className="text-sm text-muted-foreground">
                        Recibe avisos sobre mensajes y actividad
                    </div>
                </div>
                <Switch
                    checked={permission === 'granted'}
                    onCheckedChange={handleToggle}
                    disabled={permission === 'denied'}
                />
            </div>
        </div>
    )
}

