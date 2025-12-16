'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCcw, Home, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log error to an error reporting service
        console.error('Application Error:', error)
    }, [error])

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6 pt-safe pb-safe text-center">
            <div className="max-w-md space-y-6 flex flex-col items-center">
                <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight">Vaya, algo ha fallado</h2>

                <p className="text-muted-foreground">
                    Hemos encontrado un error inesperado al procesar tu solicitud.
                    Puede ser un problema temporal de conexión.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-4">
                    <Button onClick={() => reset()} variant="default" className="min-w-[140px]">
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Reintentar
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/home">
                            <Home className="mr-2 h-4 w-4" />
                            Ir al Inicio
                        </Link>
                    </Button>
                </div>

                <div className="mt-8 p-4 bg-muted/50 rounded-lg text-left w-full overflow-auto max-h-96">
                    <p className="text-xs font-mono font-bold text-destructive mb-1">Debug Info:</p>
                    <p className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all mb-2">
                        {error.message}
                    </p>
                    {error.stack && (
                        <details>
                            <summary className="text-xs font-mono font-bold text-muted-foreground cursor-pointer">Stack Trace</summary>
                            <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all mt-1">
                                {error.stack}
                            </pre>
                        </details>
                    )}
                    {error.digest && (
                        <p className="text-xs font-mono text-muted-foreground mt-2">Digest: {error.digest}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
