'use client'

import { useEffect, useState, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Network, ConnectionStatus } from '@capacitor/network'
import { App, URLOpenListenerEvent } from '@capacitor/app'

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

    // Handle deep links
    const handleDeepLink = useCallback((event: URLOpenListenerEvent) => {
        // Parse the URL and navigate accordingly
        // URL format: blife://market/product?id=123
        const url = new URL(event.url)
        const path = url.pathname || url.host // Handle both formats

        if (typeof window !== 'undefined' && path) {
            // Navigate using Next.js router
            // Remove leading slashes and construct path
            const cleanPath = path.startsWith('/') ? path : `/${path}`
            const queryString = url.search

            window.location.href = cleanPath + queryString
        }
    }, [])

    // Initialize Status Bar
    const initStatusBar = useCallback(async () => {
        try {
            // Set dark style for status bar icons (white icons)
            await StatusBar.setStyle({ style: Style.Dark })

            // Set background color to match app theme
            await StatusBar.setBackgroundColor({ color: '#000000' })

            // Optionally hide overlay for immersive experience
            // await StatusBar.setOverlaysWebView({ overlay: true })

            console.log('[Capacitor] StatusBar initialized')
        } catch (error) {
            console.error('[Capacitor] StatusBar error:', error)
        }
    }, [])

    // Initialize Splash Screen
    const initSplashScreen = useCallback(async () => {
        try {
            // Hide splash screen with fade animation
            await SplashScreen.hide({ fadeOutDuration: 300 })
            console.log('[Capacitor] SplashScreen hidden')
        } catch (error) {
            console.error('[Capacitor] SplashScreen error:', error)
        }
    }, [])

    // Initialize Network monitoring
    const initNetwork = useCallback(async () => {
        try {
            // Get initial network status
            const status: ConnectionStatus = await Network.getStatus()

            setState(prev => ({
                ...prev,
                network: {
                    connected: status.connected,
                    connectionType: status.connectionType
                },
                isOnline: status.connected
            }))

            // Listen for network changes
            Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
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
    }, [])

    // Initialize deep link handling
    const initDeepLinks = useCallback(async () => {
        try {
            // Handle app opened via deep link
            App.addListener('appUrlOpen', handleDeepLink)

            console.log('[Capacitor] Deep link handling initialized')
        } catch (error) {
            console.error('[Capacitor] Deep link error:', error)
        }
    }, [handleDeepLink])

    // Main initialization
    useEffect(() => {
        const isNative = Capacitor.isNativePlatform()

        setState(prev => ({ ...prev, isNative }))

        if (!isNative) {
            // For web, just mark as initialized
            setState(prev => ({ ...prev, isInitialized: true }))
            return
        }

        const initializeCapacitor = async () => {
            // Initialize all plugins
            await Promise.all([
                initStatusBar(),
                initNetwork(),
                initDeepLinks()
            ])

            // Hide splash screen after plugins are initialized
            // Small delay to ensure smooth transition
            setTimeout(async () => {
                await initSplashScreen()
                setState(prev => ({ ...prev, isInitialized: true }))
            }, 100)
        }

        initializeCapacitor()

        // Cleanup listeners on unmount
        return () => {
            if (isNative) {
                Network.removeAllListeners()
                App.removeAllListeners()
            }
        }
    }, [initStatusBar, initSplashScreen, initNetwork, initDeepLinks])

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
        const isNative = Capacitor.isNativePlatform()

        if (!isNative) {
            // Use browser's online/offline events for web
            const handleOnline = () => setIsOnline(true)
            const handleOffline = () => setIsOnline(false)

            setIsOnline(navigator.onLine)

            window.addEventListener('online', handleOnline)
            window.addEventListener('offline', handleOffline)

            return () => {
                window.removeEventListener('online', handleOnline)
                window.removeEventListener('offline', handleOffline)
            }
        }

        // For native, use Capacitor Network plugin
        const initNetwork = async () => {
            try {
                const status = await Network.getStatus()
                setIsOnline(status.connected)
                setConnectionType(status.connectionType)

                Network.addListener('networkStatusChange', (status) => {
                    setIsOnline(status.connected)
                    setConnectionType(status.connectionType)
                })
            } catch (error) {
                console.error('[Network] Error:', error)
            }
        }

        initNetwork()

        return () => {
            Network.removeAllListeners()
        }
    }, [])

    return { isOnline, connectionType }
}
