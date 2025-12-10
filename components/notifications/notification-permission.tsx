import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { createClient } from '@/lib/supabase'

export function NotificationPermission() {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [mounted, setMounted] = useState(false)
    const [debugInfo, setDebugInfo] = useState<string>('')
    const supabase = createClient()

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
            } catch (e: any) {
                console.error('Error checking native permissions:', e)
                if (e.message?.includes('not implemented')) {
                    setDebugInfo('Error: Plugin no implementado. Reconstruye la app (npx cap sync).')
                }
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
            } catch (error: any) {
                console.error('Error requesting native permission:', error)
                toast.error(`Error: ${error.message || 'No se pudieron solicitar permisos'}`)
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



    const testServerPush = async () => {
        try {
            toast.loading('Enviando prueba al servidor...')
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase.functions.invoke('push-notification', {
                body: {
                    record: {
                        user_id: user.id,
                        title: 'Prueba de Servidor',
                        message: 'Si lees esto, la configuración de servidor es correcta',
                        id: 'test-' + Date.now()
                    }
                }
            })

            if (error) {
                console.error('Function error:', error)
                toast.error('Error en servidor: ' + error.message)
                setDebugInfo('Error: ' + error.message)
            } else {
                console.log('Function success:', data)
                toast.success('Prueba enviada. Espera la notificación.')
                setDebugInfo('Respuesta servidor: ' + JSON.stringify(data))
            }
            toast.dismiss()
        } catch (e: any) {
            toast.error('Error al invocar función')
            setDebugInfo('Excepción: ' + e.message)
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

            {/* Warning for dev environment/build issues */}
            {debugInfo && debugInfo.includes('sync') && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-xs">
                    <p className="font-bold">Configuración Requerida</p>
                    <p>{debugInfo}</p>
                </div>
            )}

            {permission === 'granted' && (
                <div className="p-4 bg-muted rounded-lg text-xs font-mono space-y-2">
                    <p className="font-bold">Diagnóstico:</p>
                    <p>Estado: {permission}</p>
                    <p>Plataforma: {Capacitor.getPlatform()}</p>
                    <Button variant="outline" size="sm" onClick={testServerPush} className="w-full mt-2">
                        Probar Notificación de Servidor
                    </Button>
                    {debugInfo && (
                        <div className="mt-2 p-2 bg-background rounded border overflow-auto max-h-32">
                            {debugInfo}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
