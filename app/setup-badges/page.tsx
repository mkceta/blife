'use client'

import { useState } from 'react'
import { setupBadgesSystem } from '@/app/actions/setup-badges'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function SetupBadgesPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<string>('')

    const handleSetup = async () => {
        setLoading(true)
        try {
            const res = await setupBadgesSystem()
            if (res.success) {
                toast.success('Sistema de insignias actualizado correctamente')
                setResult(res.message || 'Éxito')
            } else {
                toast.error('Error: ' + res.error)
                setResult('Error: ' + res.error)
            }
        } catch (e: any) {
            toast.error('Error inesperado')
            setResult('Error: ' + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
            <h1 className="text-2xl font-bold">Configuración de Insignias</h1>
            <p className="text-muted-foreground text-center max-w-md">
                Pulsa el botón para crear las insignias en la base de datos y otorgarlas a todos los usuarios existentes según sus estadísticas actuales.
            </p>
            <Button onClick={handleSetup} disabled={loading} size="lg">
                {loading ? 'Procesando...' : 'Inicializar Insignias'}
            </Button>
            {result && (
                <div className="p-4 bg-muted rounded-lg font-mono text-xs max-w-lg break-words">
                    {result}
                </div>
            )}
        </div>
    )
}
