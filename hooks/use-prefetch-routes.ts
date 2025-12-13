'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Critical routes that should be prefetched for better navigation performance
 */
const CRITICAL_ROUTES = [
    '/market',
    '/messages',
    '/community',
    '/profile',
] as const

/**
 * Hook to prefetch critical routes for faster navigation
 * Automatically prefetches routes when the app loads
 * 
 * @example
 * ```tsx
 * // In layout.tsx or a top-level component
 * function App() {
 *   usePrefetchRoutes()
 *   return <YourApp />
 * }
 * ```
 */
export function usePrefetchRoutes() {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Don't prefetch on auth pages to save bandwidth
        if (pathname?.startsWith('/auth')) return

        // Prefetch critical routes after a short delay
        // This ensures the current page loads first
        const timeoutId = setTimeout(() => {
            CRITICAL_ROUTES.forEach((route) => {
                // Don't prefetch the current route
                if (route !== pathname) {
                    router.prefetch(route)
                }
            })
        }, 1000) // Wait 1s after page load

        return () => clearTimeout(timeoutId)
    }, [router, pathname])
}

/**
 * Hook to prefetch a specific route on hover/focus
 * Useful for important links that users are likely to click
 * 
 * @example
 * ```tsx
 * function ImportantLink() {
 *   const prefetch = usePrefetchRoute('/important-page')
 *   
 *   return (
 *     <Link 
 *       href="/important-page"
 *       onMouseEnter={prefetch}
 *       onFocus={prefetch}
 *     >
 *       Important Page
 *     </Link>
 *   )
 * }
 * ```
 */
export function usePrefetchRoute(route: string) {
    const router = useRouter()

    return () => {
        router.prefetch(route)
    }
}
