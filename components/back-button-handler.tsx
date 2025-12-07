'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'

export function BackButtonHandler() {
    const pathname = usePathname()
    const lastPressed = useRef<number>(0)

    useEffect(() => {
        // Check if PWA/Mobile (Android primarily)
        const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://')

        if (!isPWA) return

        // Define "Root" pages where we might want to exit or specific tabs
        // In a tabbed app, usually we want to trap back on all main tabs to prevent accidental exit
        // If not on these tabs (e.g. details page), we assume standard back navigation works fine.
        const isRoot = ['/home', '/search', '/messages', '/profile'].includes(pathname)

        if (!isRoot) return

        // Push a dummy state to trap the first back press
        // We use a specific state object to identify our trap if needed, though simple null works
        const pushTrap = () => {
            window.history.pushState('back_trap', '', window.location.href)
        }

        pushTrap()

        const handlePopState = (event: PopStateEvent) => {
            // The user pressed back, so the browser has ALREADY popped the state.
            // We are now "one step back" in history compared to before the press.

            const now = Date.now()
            const timeDiff = now - lastPressed.current

            if (timeDiff < 2000) {
                // Double press detected within 2 seconds
                // Allow the exit (or navigation to previous real page)
                // Since we are already "back" (due to popstate), we might need one more push 
                // to actually exit if we created a trap.
                // If we just do nothing, we stay at the state *before* the trap. 
                // If that state was the actual start of the app, we are fine, we are at "Entry".
                // But to truly "Exit" the app, we generally strictly need to run out of history.

                // Try explicitly going back again to clear the "Entry" state if needed
                window.history.back()
            } else {
                // First press
                lastPressed.current = now
                toast.info('Pulsa atrás otra vez para salir', { duration: 2000 })

                // Re-push the trap state so we are "forward" again.
                // Next back press will trigger popstate again.
                pushTrap()
            }
        }

        window.addEventListener('popstate', handlePopState)

        return () => {
            window.removeEventListener('popstate', handlePopState)
        }
    }, [pathname])

    return null
}
