/**
 * Deep linking utilities for BLife app
 * 
 * Supports two URL schemes:
 * 1. Custom scheme: blife://market/product?id=123
 * 2. HTTPS App Links: https://blife-udc.vercel.app/market/product?id=123
 */

const APP_SCHEME = 'blife'
const WEB_HOST = 'b-life.app'

/**
 * Generate a shareable deep link URL
 * On native, uses custom scheme for in-app opening
 * On web, uses https for universal links
 */
export function createDeepLink(path: string, params?: Record<string, string>): string {
    // Clean path - ensure it starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`

    // Build query string if params provided
    const queryString = params
        ? '?' + new URLSearchParams(params).toString()
        : ''

    return `https://${WEB_HOST}${cleanPath}${queryString}`
}

/**
 * Generate a native app deep link (custom scheme)
 * Use this for sharing links that should open directly in the app
 */
export function createNativeDeepLink(path: string, params?: Record<string, string>): string {
    // Clean path - remove leading slash for scheme format
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    // Build query string if params provided
    const queryString = params
        ? '?' + new URLSearchParams(params).toString()
        : ''

    return `${APP_SCHEME}://${cleanPath}${queryString}`
}

/**
 * Parse a deep link URL and extract path and params
 */
export function parseDeepLink(url: string): { path: string; params: Record<string, string> } | null {
    try {
        const parsed = new URL(url)

        // Handle custom scheme (blife://)
        if (parsed.protocol === `${APP_SCHEME}:`) {
            // In custom scheme, host is the first path segment
            const path = `/${parsed.host}${parsed.pathname}`
            const params: Record<string, string> = {}
            parsed.searchParams.forEach((value, key) => {
                params[key] = value
            })
            return { path, params }
        }

        // Handle https links
        if (parsed.protocol === 'https:' && parsed.host === WEB_HOST) {
            const params: Record<string, string> = {}
            parsed.searchParams.forEach((value, key) => {
                params[key] = value
            })
            return { path: parsed.pathname, params }
        }

        return null
    } catch {
        return null
    }
}

// Common deep link paths
export const DeepLinkPaths = {
    // Market
    marketProduct: (id: string) => createDeepLink('/market/product', { id }),
    marketListing: (id: string) => createDeepLink(`/market/${id}`),

    // Community
    communityPost: (id: string) => createDeepLink(`/community/post/${id}`),

    // Flats
    flatListing: (id: string) => createDeepLink(`/flats/${id}`),

    // Profile
    userProfile: (username: string) => createDeepLink(`/user/${username}`),

    // Messages
    conversation: (id: string) => createDeepLink(`/messages/${id}`),
}

/**
 * Example usage:
 * 
 * // Create a shareable product link
 * const productLink = DeepLinkPaths.marketProduct('123')
 * // Result: https://blife-udc.vercel.app/market/product?id=123
 * 
 * // Create a native app link (for sharing)
 * const nativeLink = createNativeDeepLink('market/product', { id: '123' })
 * // Result: blife://market/product?id=123
 * 
 * // Share to clipboard or messaging apps
 * navigator.share({
 *   title: 'Check out this product!',
 *   url: productLink
 * })
 */
