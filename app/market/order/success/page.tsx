'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'

function SuccessContent() {
    const searchParams = useSearchParams()
    const redirectStatus = searchParams.get('redirect_status')

    const [status, setStatus] = useState<'loading' | 'success' | 'processing' | 'error'>('loading')

    useEffect(() => {
        if (!redirectStatus) {
            // If accessed directly without params, maybe show error or redirect
            // For now let's assume if it loads it's okay or show generic success if testing
            // But realistically stripe always sends params.
            if (process.env.NODE_ENV === 'development') {
                setStatus('success') // Manual testing convenience
            } else {
                setStatus('error')
            }
            return
        }

        switch (redirectStatus) {
            case 'succeeded':
                setStatus('success')
                break
            case 'processing':
                setStatus('processing')
                break
            case 'requires_payment_method':
                setStatus('error')
                break
            default:
                setStatus('success')
                break
        }
    }, [redirectStatus])

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Verificando pago...</p>
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                <div className="mb-6 rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                    <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Algo salió mal</h1>
                <p className="text-muted-foreground mb-8 max-w-md">
                    No pudimos confirmar tu pago. Por favor, revisa si se ha realizado el cargo o intenta de nuevo.
                </p>
                <div className="flex gap-4">
                    <Button asChild variant="default">
                        <Link href="/market">Volver al mercado</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-in fade-in duration-500 slide-in-from-bottom-4 bg-background text-foreground">
            <div className="mb-6 rounded-full bg-green-100 p-3 dark:bg-green-900/30 ring-8 ring-green-50 dark:ring-green-900/10">
                {status === 'processing' ? (
                    <Loader2 className="h-12 w-12 text-green-600 dark:text-green-400 animate-spin" />
                ) : (
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                )}
            </div>

            <h1 className="text-3xl font-bold mb-2 tracking-tight">
                {status === 'processing' ? 'Procesando pago...' : '¡Pago realizado con éxito!'}
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md text-lg">
                {status === 'processing'
                    ? 'Tu pago se está procesando. Te notificaremos cuando se complete.'
                    : 'Tu compra se ha procesado correctamente. El vendedor recibirá la notificación y preparará tu pedido.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Button asChild variant="outline" className="w-full h-12 text-base">
                    <Link href="/market">
                        Volver al mercado
                    </Link>
                </Button>
                <Button asChild className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20">
                    <Link href="/profile">
                        Ver mi perfil
                    </Link>
                </Button>
            </div>
        </div>
    )
}

export default function OrderSuccessPage() {
    return (
        <div className="min-h-screen bg-background pt-safe">
            <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>}>
                <SuccessContent />
            </Suspense>
        </div>
    )
}
