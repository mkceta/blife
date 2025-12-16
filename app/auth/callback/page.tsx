'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        const code = searchParams.get('code')
        const next = searchParams.get('next') || '/'

        if (code) {
            supabase.auth.exchangeCodeForSession(code).then(({ error }: { error: Error | null }) => {
                if (!error) {
                    router.push(next)
                } else {
                    router.push('/auth/auth-code-error')
                }
            })
        } else {
            router.push('/')
        }
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
