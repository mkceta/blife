'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'

export function NotificationPermission() {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission)
        }
    }, [])

    if (!mounted) return null

    const handleToggle = async (checked: boolean) => {
        if (!checked) {
            // User wants to disable. We can't do this programmatically in browser.
            toast.info('Para desactivar las notificaciones, debes hacerlo desde la configuración del navegador.')
            return
        }

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
