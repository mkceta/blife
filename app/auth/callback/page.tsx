'use client'

import { useEffect, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    const [isProcessing, setIsProcessing] = useState(true)

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code')
            const next = searchParams.get('next') || '/'
            const error = searchParams.get('error')
            const errorCode = searchParams.get('error_code')
            const errorDescription = searchParams.get('error_description')
            const type = searchParams.get('type')

            console.log('[Auth Callback] Params:', { code: !!code, next, error, errorCode, type })

            // Handle error from Supabase
            if (error) {
                console.error('[Auth Callback] Error:', error, errorCode, errorDescription)

                // For expired OTP, redirect to forgot-password with helpful message
                if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
                    router.push('/auth/forgot-password?error=expired')
                    return
                }

                // For other errors, go to login
                router.push('/auth/login?error=' + encodeURIComponent(errorDescription || error))
                return
            }

            // If type is recovery, redirect to reset password
            if (type === 'recovery') {
                console.log('[Auth Callback] Recovery type detected, redirecting to reset-password')
                router.push('/auth/reset-password')
                return
            }

            // Handle code exchange (for email confirmation, magic links, recovery)
            if (code) {
                console.log('[Auth Callback] Exchanging code for session...')
                const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

                if (exchangeError) {
                    console.error('[Auth Callback] Exchange error:', exchangeError)
                    router.push('/auth/auth-code-error')
                    return
                }

                console.log('[Auth Callback] Session established, next:', next)

                // Check if this is a recovery flow
                if (next === '/auth/reset-password' || next.includes('reset-password')) {
                    console.log('[Auth Callback] Recovery flow detected via next param')
                    router.push('/auth/reset-password')
                    return
                }

                router.push(next)
                return
            }

            // Check for hash-based tokens (used in some recovery flows)
            if (typeof window !== 'undefined' && window.location.hash) {
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const accessToken = hashParams.get('access_token')
                const hashType = hashParams.get('type')

                console.log('[Auth Callback] Hash params:', { hasAccessToken: !!accessToken, type: hashType })

                if (accessToken && hashType === 'recovery') {
                    console.log('[Auth Callback] Recovery token in hash, setting session...')
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: hashParams.get('refresh_token') || '',
                    })

                    if (sessionError) {
                        console.error('[Auth Callback] Session error:', sessionError)
                        router.push('/auth/forgot-password?error=invalid_link')
                        return
                    }

                    router.push('/auth/reset-password')
                    return
                }
            }

            // Check if there's already a session (Supabase might have auto-handled the token)
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                console.log('[Auth Callback] Session exists, checking for recovery...')
                // If we have a session but no code, might be auto-handled recovery
                // Redirect to appropriate page
                if (next === '/auth/reset-password' || next.includes('reset-password')) {
                    router.push('/auth/reset-password')
                    return
                }
                router.push(next)
                return
            }

            // No code, no hash, no session - redirect to home
            console.log('[Auth Callback] No auth data found, redirecting to home')
            setIsProcessing(false)
            router.push('/')
        }

        // Also listen for auth state changes (for auto-handled recovery)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
            console.log('[Auth Callback] Auth state change:', event)

            if (event === 'PASSWORD_RECOVERY') {
                console.log('[Auth Callback] PASSWORD_RECOVERY event detected!')
                router.push('/auth/reset-password')
            }
        })

        handleCallback()

        return () => {
            subscription.unsubscribe()
        }
    }, [searchParams, router, supabase])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">{isProcessing ? 'Procesando...' : 'Redirigiendo...'}</p>
            </div>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>}>
            <AuthCallbackContent />
        </Suspense>
    )
}
