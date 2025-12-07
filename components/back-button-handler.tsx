'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function BackButtonHandler() {
    const pathname = usePathname()

    useEffect(() => {
        // Only apply on mobile/PWA
        const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://')

        if (!isPWA) return

        // Push a dummy state when component mounts or route changes
        // This ensures there's always something to "pop" before closing the app
        window.history.pushState(null, '', window.location.href)

        const handlePopState = (event: PopStateEvent) => {
            // If we are at the root path, maybe we want to let it close?
            // Or maybe show a "Press back again to exit" toast?
            // For now, this simple logic prevents immediate closure on first back press

            // Re-push state to keep the trap active if we are not at root
            if (pathname !== '/') {
                // Let the router handle the back navigation naturally
                // But if we are at root, keep the trap
            } else {
                // If at root, re-push to prevent exit
                window.history.pushState(null, '', window.location.href)
            }
        }

        window.addEventListener('popstate', handlePopState)

        return () => {
            window.removeEventListener('popstate', handlePopState)
        }
    }, [pathname])

    return null
}
