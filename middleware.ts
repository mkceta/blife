import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that REQUIRE authentication
const PROTECTED_ROUTES = [
    '/profile',
    '/messages',
    '/market/new',
    '/market/edit',
    '/flats/edit',
    '/community/new',
    '/notifications',
    '/wishlist',
    '/admin',
]

// Routes that should redirect away if already logged in
const AUTH_ROUTES = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify',
]

// Routes that need auth-based redirects
const CONDITIONAL_ROUTES = ['/', '/landing']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check route types
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))
    const isConditionalRoute = CONDITIONAL_ROUTES.includes(pathname)

    // Skip auth check entirely for public routes (saves ~100ms per request!)
    if (!isProtectedRoute && !isAuthRoute && !isConditionalRoute) {
        return NextResponse.next()
    }

    // Create response with request headers
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Only create Supabase client when we need to check auth
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // Get user (only for protected/auth/conditional routes now)
    const { data: { user } } = await supabase.auth.getUser()

    // Handle conditional routes (/, /landing)
    if (isConditionalRoute) {
        if (user) {
            // Logged in users should go to market, not landing
            return NextResponse.redirect(new URL('/market', request.url))
        } else if (pathname === '/') {
            // Non-logged users at root should see landing
            return NextResponse.redirect(new URL('/landing', request.url))
        }
        // Non-logged users at /landing just see the page
        return response
    }

    // Redirect to login if accessing protected route without auth
    if (isProtectedRoute && !user) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && user && pathname !== '/auth/callback') {
        return NextResponse.redirect(new URL('/market', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Static assets (.svg, .png, .jpg, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

