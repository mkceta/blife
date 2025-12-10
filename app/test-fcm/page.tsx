'use client'

import { FcmTest } from '@/components/notifications/fcm-test'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function TestFcmPage() {
    return (
        <div className="min-h-screen bg-background p-4 pb-24">
            <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/profile">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Test de Notificaciones</h1>
                        <p className="text-sm text-muted-foreground">
                            Prueba el sistema de push notifications
                        </p>
                    </div>
                </div>

                <FcmTest />

                <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                    <h3 className="font-semibold">📋 Instrucciones:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Abre la app en Android Studio</li>
                        <li>Ejecuta en un dispositivo físico o emulador</li>
                        <li>Acepta los permisos de notificaciones</li>
                        <li>Verifica que aparezca un dispositivo registrado</li>
                        <li>Click en "Enviar Notificación de Prueba"</li>
                        <li>Deberías recibir la notificación</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}
