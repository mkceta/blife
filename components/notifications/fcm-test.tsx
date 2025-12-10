'use client'

import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Bell, Check, X, RefreshCw, Send, TestTube } from 'lucide-react'

export function FcmTest() {
    const [isNative, setIsNative] = useState(false)
    const [permissionStatus, setPermissionStatus] = useState<string>('unknown')
    const [devices, setDevices] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform())
        checkPermissions()
        loadDevices()
    }, [])

    const checkPermissions = async () => {
        if (!Capacitor.isNativePlatform()) return

        try {
            const status = await PushNotifications.checkPermissions()
            setPermissionStatus(status.receive)
        } catch (e) {
            console.error('Error checking permissions:', e)
        }
    }

    const loadDevices = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('user_devices')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error loading devices:', error)
            toast.error('Error cargando dispositivos')
        } else {
            setDevices(data || [])
        }
    }

    const requestPermissions = async () => {
        if (!Capacitor.isNativePlatform()) {
            toast.error('Solo funciona en dispositivos nativos')
            return
        }

        try {
            const result = await PushNotifications.requestPermissions()
            setPermissionStatus(result.receive)

            if (result.receive === 'granted') {
                toast.success('Permisos concedidos')
                await PushNotifications.register()
            } else {
                toast.error('Permisos denegados')
            }
        } catch (e: any) {
            console.error('Error requesting permissions:', e)
            toast.error('Error: ' + (e?.message || JSON.stringify(e)))
        }
    }

    const sendLocalNotification = async () => {
        if (!Capacitor.isNativePlatform()) {
            toast.error('Solo funciona en dispositivos nativos')
            return
        }

        try {
            // Request permission for local notifications
            const perm = await LocalNotifications.requestPermissions()

            if (perm.display !== 'granted') {
                toast.error('Permisos de notificaciones locales denegados')
                return
            }

            // Schedule a local notification
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: '🧪 Prueba Local',
                        body: '¡Esta es una notificación local de prueba!',
                        id: Date.now(),
                        schedule: { at: new Date(Date.now() + 1000) }, // 1 segundo
                        sound: undefined,
                        attachments: undefined,
                        actionTypeId: '',
                        extra: null
                    }
                ]
            })

            toast.success('Notificación local programada (1 segundo)')
        } catch (e: any) {
            console.error('Error sending local notification:', e)
            toast.error('Error: ' + e.message)
        }
    }

    const sendTestNotification = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Debes estar autenticado')
                return
            }

            // Try to call Edge Function
            const { data, error } = await supabase.functions.invoke('push-notification', {
                body: {
                    record: {
                        user_id: user.id,
                        title: '🧪 Prueba de Notificación',
                        message: 'Si ves esto, ¡las notificaciones funcionan! 🎉',
                        link: '/notifications',
                        type: 'test'
                    }
                }
            })

            if (error) {
                console.error('Error sending notification:', error)
                toast.error('Edge Function no disponible. Usa notificación local en su lugar.')
            } else {
                console.log('Notification sent:', data)
                toast.success(`Notificación enviada a ${data.sent_to} dispositivo(s)`)
            }
        } catch (e: any) {
            console.error('Exception sending notification:', e)
            toast.error('Edge Function no configurado. Prueba con notificación local.')
        } finally {
            setLoading(false)
        }
    }

    const deleteDevice = async (deviceId: string) => {
        const { error } = await supabase
            .from('user_devices')
            .delete()
            .eq('id', deviceId)

        if (error) {
            toast.error('Error eliminando dispositivo')
        } else {
            toast.success('Dispositivo eliminado')
            loadDevices()
        }
    }

    if (!isNative) {
        return (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        FCM Test (Solo Nativo)
                    </CardTitle>
                    <CardDescription>
                        Las notificaciones push solo funcionan en dispositivos Android/iOS.
                        Compila la app con Android Studio para probar.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Estado de Notificaciones Push
                    </CardTitle>
                    <CardDescription>
                        Plataforma: {Capacitor.getPlatform()}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Permission Status */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">Permisos</span>
                        <Badge variant={
                            permissionStatus === 'granted' ? 'default' :
                                permissionStatus === 'denied' ? 'destructive' :
                                    'secondary'
                        }>
                            {permissionStatus === 'granted' && <Check className="h-3 w-3 mr-1" />}
                            {permissionStatus === 'denied' && <X className="h-3 w-3 mr-1" />}
                            {permissionStatus}
                        </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        {permissionStatus !== 'granted' && (
                            <Button onClick={requestPermissions} className="flex-1">
                                <Bell className="h-4 w-4 mr-2" />
                                Solicitar Permisos
                            </Button>
                        )}

                        <Button
                            onClick={loadDevices}
                            variant="outline"
                            size="icon"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>

                    {permissionStatus === 'granted' && (
                        <div className="space-y-2">
                            <Button
                                onClick={sendLocalNotification}
                                className="w-full"
                                variant="default"
                            >
                                <TestTube className="h-4 w-4 mr-2" />
                                Enviar Notificación Local (Prueba Rápida)
                            </Button>

                            <Button
                                onClick={sendTestNotification}
                                disabled={loading}
                                className="w-full"
                                variant="outline"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                {loading ? 'Enviando...' : 'Enviar Push Notification (Requiere Edge Function)'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Devices List */}
            {devices.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dispositivos Registrados ({devices.length})</CardTitle>
                        <CardDescription>
                            Tokens FCM guardados en la base de datos
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {devices.map((device) => (
                            <div
                                key={device.id}
                                className="p-3 bg-muted rounded-lg space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline">
                                        {device.platform}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteDevice(device.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                                    {device.fcm_token.substring(0, 50)}...
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Última actividad: {new Date(device.last_active).toLocaleString('es-ES')}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {devices.length === 0 && permissionStatus === 'granted' && (
                <Card className="border-yellow-500/50 bg-yellow-500/5">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground text-center">
                            No hay dispositivos registrados. El token se guardará automáticamente al recibir el evento de registro.
                            Intenta cerrar y abrir la app.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Info Card */}
            <Card className="border-blue-500/50 bg-blue-500/5">
                <CardHeader>
                    <CardTitle className="text-sm">💡 Nota sobre Edge Function</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2 text-muted-foreground">
                    <p>
                        <strong>Notificación Local</strong>: Funciona siempre, se programa en el dispositivo.
                    </p>
                    <p>
                        <strong>Push Notification</strong>: Requiere que el Edge Function esté desplegado en Supabase con Firebase configurado.
                    </p>
                    <p className="text-xs">
                        Si ves "Failed to send a request", significa que el Edge Function no está disponible.
                        Usa la notificación local para probar que los permisos funcionan.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
