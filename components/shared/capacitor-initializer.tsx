'use client'

import { useCapacitorInit } from '@/hooks/use-capacitor-init'

/**
 * Component that initializes Capacitor plugins on app start.
 * This should be placed in the root layout to ensure plugins are
 * initialized as early as possible.
 * 
 * Handles:
 * - StatusBar styling
 * - SplashScreen hide
 * - Network monitoring
 * - Deep link handling
 */
export function CapacitorInitializer() {
    // Initialize all Capacitor plugins
    useCapacitorInit()

    // This component doesn't render anything
    return null
}
