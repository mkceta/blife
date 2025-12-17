'use client'

import { useEffect, useState, useCallback } from 'react'

interface NetworkInfo {
    connected: boolean
    connectionType: string
}

interface CapacitorInitState {
    isNative: boolean
    isInitialized: boolean
    network: NetworkInfo
    isOnline: boolean
}

/**
 * Centralized hook for initializing Capacitor plugins.
 * Uses dynamic imports to avoid SSR issues.
 * Handles:
 * - StatusBar styling (dark mode, background color)
 * - SplashScreen programmatic hide
 * - Network status monitoring
 * - Deep link handling
 */
export function useCapacitorInit() {
    const [state, setState] = useState<CapacitorInitState>({
        isNative: false,
        isInitialized: false,
        network: {
            connected: true,
            connectionType: 'unknown'
        },
        isOnline: true
    })

    // Main initialization
    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return

        const initializeCapacitor = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const { Capacitor } = await import('@capacitor/core')
                const isNative = Capacitor.isNativePlatform()

                setState(prev => ({ ...prev, isNative }))

                if (!isNative) {
                    // For web, just mark as initialized
                    setState(prev => ({ ...prev, isInitialized: true }))
                    return
                }

                // Dynamic imports for native-only plugins
                const [
                    { StatusBar, Style },
                    { SplashScreen },
                    { Network },
                    { App }
                ] = await Promise.all([
                    import('@capacitor/status-bar'),
                    import('@capacitor/splash-screen'),
                    import('@capacitor/network'),
                    import('@capacitor/app')
                ])

                // Initialize StatusBar
                try {
                    await StatusBar.setStyle({ style: Style.Dark })
                    await StatusBar.setBackgroundColor({ color: '#000000' })
                    console.log('[Capacitor] StatusBar initialized')
                } catch (error) {
                    console.error('[Capacitor] StatusBar error:', error)
                }

                // Initialize Network monitoring
                try {
                    const status = await Network.getStatus()
                    setState(prev => ({
                        ...prev,
                        network: {
                            connected: status.connected,
                            connectionType: status.connectionType
                        },
                        isOnline: status.connected
                    }))

                    Network.addListener('networkStatusChange', (status) => {
                        console.log('[Capacitor] Network status changed:', status)
                        setState(prev => ({
                            ...prev,
                            network: {
                                connected: status.connected,
                                connectionType: status.connectionType
                            },
                            isOnline: status.connected
                        }))
                    })
                    console.log('[Capacitor] Network monitoring initialized')
                } catch (error) {
                    console.error('[Capacitor] Network error:', error)
                }

                // Initialize deep link handling
                try {
                    App.addListener('appUrlOpen', (event) => {
                        const url = new URL(event.url)
                        const path = url.pathname || url.host
                        if (path) {
                            const cleanPath = path.startsWith('/') ? path : `/${path}`
                            window.location.href = cleanPath + url.search
                        }
                    })
                    console.log('[Capacitor] Deep link handling initialized')
                } catch (error) {
                    console.error('[Capacitor] Deep link error:', error)
                }

                // Hide splash screen after a small delay
                setTimeout(async () => {
                    try {
                        await SplashScreen.hide({ fadeOutDuration: 300 })
                        console.log('[Capacitor] SplashScreen hidden')
                    } catch (error) {
                        console.error('[Capacitor] SplashScreen error:', error)
                    }
                    setState(prev => ({ ...prev, isInitialized: true }))
                }, 100)

            } catch (error) {
                console.error('[Capacitor] Initialization error:', error)
                setState(prev => ({ ...prev, isInitialized: true }))
            }
        }

        initializeCapacitor()

        // Cleanup on unmount - use dynamic import
        return () => {
            if (state.isNative) {
                import('@capacitor/network').then(({ Network }) => {
                    Network.removeAllListeners()
                }).catch(() => { })
                import('@capacitor/app').then(({ App }) => {
                    App.removeAllListeners()
                }).catch(() => { })
            }
        }
    }, [])

    return state
}

/**
 * Hook to get current network status
 * Use this in components that need to react to offline state
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true)
    const [connectionType, setConnectionType] = useState<string>('unknown')

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return

        let cleanup: (() => void) | undefined

        const initNetwork = async () => {
            try {
                const { Capacitor } = await import('@capacitor/core')
                const isNative = Capacitor.isNativePlatform()

                if (!isNative) {
                    // Use browser's online/offline events for web
                    const handleOnline = () => setIsOnline(true)
                    const handleOffline = () => setIsOnline(false)

                    setIsOnline(navigator.onLine)

                    window.addEventListener('online', handleOnline)
                    window.addEventListener('offline', handleOffline)

                    cleanup = () => {
                        window.removeEventListener('online', handleOnline)
                        window.removeEventListener('offline', handleOffline)
                    }
                    return
                }

                // For native, use Capacitor Network plugin
                const { Network } = await import('@capacitor/network')
                const status = await Network.getStatus()
                setIsOnline(status.connected)
                setConnectionType(status.connectionType)

                Network.addListener('networkStatusChange', (status) => {
                    setIsOnline(status.connected)
                    setConnectionType(status.connectionType)
                })

                cleanup = () => {
                    Network.removeAllListeners()
                }
            } catch (error) {
                console.error('[Network] Error:', error)
                // Fallback to browser API
                setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
            }
        }

        initNetwork()

        return () => {
            if (cleanup) cleanup()
        }
    }, [])

    return { isOnline, connectionType }
}

