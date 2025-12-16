'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'
import './globals.css' // Import styles to ensure minimal formatting

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global Error:', error)
    }, [error])

    return (
        <html lang="es">
            <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
                <div className="max-w-md text-center space-y-6">
                    <h1 className="text-3xl font-black mb-2">Error Crítico</h1>
                    <p className="text-muted-foreground">
                        La aplicación ha encontrado un error irrecuperable en el sistema principal.
                    </p>
                    <Button onClick={() => reset()} size="lg" className="w-full">
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Reiniciar Aplicación
                    </Button>

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
            </body>
        </html>
    )
}
