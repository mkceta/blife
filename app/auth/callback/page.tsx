'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code')
            const next = searchParams.get('next') || '/'
            const error = searchParams.get('error')
            const errorDescription = searchParams.get('error_description')

            // Handle error from Supabase
            if (error) {
                console.error('Auth error:', error, errorDescription)
                router.push('/auth/login?error=' + encodeURIComponent(errorDescription || error))
                return
            }

            // Handle code exchange (for email confirmation, magic links)
            if (code) {
                const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

                if (exchangeError) {
                    console.error('Exchange error:', exchangeError)
                    router.push('/auth/auth-code-error')
                    return
                }

                // Check if this is a recovery flow
                if (data.session?.user?.recovery_sent_at || next === '/auth/reset-password') {
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
                const type = hashParams.get('type')

                if (accessToken && type === 'recovery') {
                    // Set the session from the recovery token
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: hashParams.get('refresh_token') || '',
                    })

                    if (sessionError) {
                        console.error('Session error:', sessionError)
                        router.push('/auth/forgot-password?error=invalid_link')
                        return
                    }

                    router.push('/auth/reset-password')
                    return
                }
            }

            // No code or hash, redirect to home
            router.push('/')
        }

        handleCallback()
    }, [searchParams, router, supabase])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse">Autenticando...</div>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <AuthCallbackContent />
        </Suspense>
    )
}

