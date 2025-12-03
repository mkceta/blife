'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Suspense } from 'react'

function VerifyContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email')
    const [isResending, setIsResending] = useState(false)
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    async function handleResend() {
        if (!email) return

        setIsResending(true)
        const supabase = createClient()

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`
            }
        })

        setIsResending(false)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Correo reenviado correctamente')
            setCountdown(60) // Prevent spamming
        }
    }

    return (
        <Card className="border-border bg-card text-center w-full max-w-md mx-auto shadow-xl">
            <CardHeader className="space-y-2 px-8 pt-8 pb-6">
                <CardTitle className="text-3xl font-bold tracking-tight">Verifica tu Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8">
                <div className="space-y-2">
                    <p className="text-base">Hemos enviado un enlace de confirmación a {email ? <span className="font-semibold">{email}</span> : 'tu correo'}.</p>
                    <p className="text-sm text-muted-foreground">
                        Por favor, revisa tu bandeja de entrada (y spam) para activar tu cuenta.
                    </p>
                </div>

                {email && (
                    <div className="pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResend}
                            disabled={isResending || countdown > 0}
                            className="text-primary hover:text-primary/80 h-auto py-2"
                        >
                            {isResending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            {countdown > 0 ? `Reenviar en ${countdown}s` : '¿No lo recibiste? Reenviar correo'}
                        </Button>
                    </div>
                )}

                <Button asChild variant="outline" className="w-full h-11 text-base font-medium">
                    <Link href="/auth/login">Volver al Login</Link>
                </Button>
            </CardContent>
        </Card>
    )
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <Card className="border-border bg-card text-center">
                <CardContent className="pt-6">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </CardContent>
            </Card>
        }>
            <VerifyContent />
        </Suspense>
    )
}
