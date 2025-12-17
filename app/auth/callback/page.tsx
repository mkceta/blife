'use client'

import { useEffect, Suspense, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TIMEOUT_MS = 15000 // 15 second timeout

function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'processing' | 'error' | 'success'>('processing')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const hasProcessed = useRef(false)

    useEffect(() => {
        // Prevent double execution in React StrictMode
        if (hasProcessed.current) return
        hasProcessed.current = true

        const supabase = createClient()

        // Timeout fallback - redirect to home if nothing happens
        const timeout = setTimeout(() => {
            console.warn('[Auth Callback] Timeout reached, redirecting to home')
            setStatus('error')
            setErrorMessage('La operación ha tardado demasiado. Inténtalo de nuevo.')
            setTimeout(() => router.push('/'), 2000)
        }, TIMEOUT_MS)

        // Handle auth state changes (this catches PASSWORD_RECOVERY from hash)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: unknown) => {
            console.log('[Auth Callback] Auth state change:', event, !!session)

            if (event === 'PASSWORD_RECOVERY') {
                clearTimeout(timeout)
                console.log('[Auth Callback] PASSWORD_RECOVERY event - redirecting to reset-password')
                setStatus('success')
                router.push('/auth/reset-password')
                return
            }

            if (event === 'SIGNED_IN' && session) {
                clearTimeout(timeout)
                console.log('[Auth Callback] SIGNED_IN event - redirecting')
                setStatus('success')
                const next = searchParams.get('next') || '/market'
                router.push(next)
                return
            }
        })

        // Process URL parameters
        const handleCallback = async () => {
            const code = searchParams.get('code')
            const error = searchParams.get('error')
            const errorCode = searchParams.get('error_code')
            const errorDescription = searchParams.get('error_description')
            const next = searchParams.get('next') || '/market'

            console.log('[Auth Callback] Processing:', {
                hasCode: !!code,
                hasError: !!error,
                hasHash: !!window.location.hash,
                next
            })

            // Handle explicit errors from Supabase
            if (error) {
                clearTimeout(timeout)
                console.error('[Auth Callback] Error from Supabase:', errorCode, errorDescription)

                setStatus('error')

                if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
                    setErrorMessage('El enlace ha caducado. Solicita uno nuevo.')
                    setTimeout(() => router.push('/auth/forgot-password?error=expired'), 2000)
                } else {
                    setErrorMessage(errorDescription || error)
                    setTimeout(() => router.push('/auth/login?error=' + encodeURIComponent(errorDescription || error)), 2000)
                }
                return
            }

            // Handle code exchange (email confirmation, magic links)
            if (code) {
                console.log('[Auth Callback] Exchanging code for session...')
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

                if (exchangeError) {
                    clearTimeout(timeout)
                    console.error('[Auth Callback] Exchange error:', exchangeError)
                    setStatus('error')
                    setErrorMessage('Error al verificar. El enlace puede haber caducado.')
                    setTimeout(() => router.push('/auth/login?error=verification_failed'), 2000)
                    return
                }

                // Exchange successful - the onAuthStateChange will handle redirect
                console.log('[Auth Callback] Code exchanged successfully, waiting for auth event...')
                return
            }

            // If there's a hash, Supabase SDK should process it automatically
            // The onAuthStateChange listener will catch the result
            if (window.location.hash && window.location.hash.includes('access_token')) {
                console.log('[Auth Callback] Hash detected, waiting for SDK to process...')
                // Give Supabase SDK time to process the hash
                return
            }

            // No code, no hash, no error - check if there's an existing session
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                clearTimeout(timeout)
                console.log('[Auth Callback] Existing session found, redirecting...')
                setStatus('success')

                // Check if this is a recovery redirect
                if (next.includes('reset-password')) {
                    router.push('/auth/reset-password')
                } else {
                    router.push(next)
                }
                return
            }

            // Nothing to process - this shouldn't happen normally
            console.warn('[Auth Callback] No auth data found')
            // Let the timeout handle it
        }

        handleCallback()

        return () => {
            clearTimeout(timeout)
            subscription.unsubscribe()
        }
    }, [router, searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center max-w-sm mx-auto px-4">
                {status === 'processing' && (
                    <>
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Procesando...</p>
                        <p className="text-xs text-muted-foreground/60 mt-2">Esto solo toma unos segundos</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="text-destructive text-4xl mb-4">⚠️</div>
                        <p className="text-destructive font-medium">{errorMessage || 'Ha ocurrido un error'}</p>
                        <p className="text-xs text-muted-foreground mt-2">Redirigiendo...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="text-primary text-4xl mb-4">✓</div>
                        <p className="text-primary font-medium">¡Verificado!</p>
                        <p className="text-xs text-muted-foreground mt-2">Redirigiendo...</p>
                    </>
                )}
            </div>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    )
}
