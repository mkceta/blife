import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { validateRedirectUrl } from '@/lib/auth-utils'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    // SECURITY: Validate redirect URL to prevent open redirect attacks
    const next = validateRedirectUrl(requestUrl.searchParams.get('next'))
    const error = requestUrl.searchParams.get('error')
    const errorCode = requestUrl.searchParams.get('error_code')
    const errorDescription = requestUrl.searchParams.get('error_description')

    // Only log in development
    if (process.env.NODE_ENV === 'development') {
        console.log('[Auth Confirm] Received:', { code: !!code, next, error, errorCode })
    }

    // Handle errors from Supabase
    if (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[Auth Confirm] Error:', error, errorCode, errorDescription)
        }

        if (errorCode === 'otp_expired') {
            return NextResponse.redirect(new URL('/auth/forgot-password?error=expired', requestUrl.origin))
        }

        return NextResponse.redirect(new URL('/auth/login?error=' + encodeURIComponent(errorDescription || error), requestUrl.origin))
    }

    // Exchange the code for a session (server-side)
    if (code) {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Can be ignored in middleware
                        }
                    },
                },
            }
        )

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
            if (process.env.NODE_ENV === 'development') {
                console.error('[Auth Confirm] Exchange error:', exchangeError)
            }
            return NextResponse.redirect(new URL('/auth/forgot-password?error=invalid_link', requestUrl.origin))
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('[Auth Confirm] Code exchanged successfully, redirecting to:', next)
        }

        // For password reset, redirect to reset-password page (next is already validated)
        if (next.includes('reset-password')) {
            return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin))
        }

        return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    // No code - redirect to home
    if (process.env.NODE_ENV === 'development') {
        console.log('[Auth Confirm] No code found, redirecting to home')
    }
    return NextResponse.redirect(new URL('/', requestUrl.origin))
}
