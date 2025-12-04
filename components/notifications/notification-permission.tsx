'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

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
                const status = await PushNotifications.checkPermissions()
                // Map Capacitor permission to Web NotificationPermission
                if (status.receive === 'granted') {
                    setPermission('granted')
                } else if (status.receive === 'denied') {
                    setPermission('denied')
                } else {
                    setPermission('default')
                }
            } catch (e) {
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
                const result = await PushNotifications.requestPermissions()
                if (result.receive === 'granted') {
                    await PushNotifications.register()
                    setPermission('granted')
                    toast.success('Notificaciones activadas')
                } else {
                    setPermission('denied')
                    toast.error('Permiso denegado. Actívalo en Ajustes.')
                }
            } catch (error) {
                console.error('Error requesting native permission:', error)
                toast.error('Error al solicitar permisos')
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
    )
}
