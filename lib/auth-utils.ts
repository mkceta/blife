/**
 * Security utilities for auth-related operations
 * @module lib/auth-utils
 */

/**
 * Allowed redirect paths for post-authentication redirects.
 * Add new paths here when extending the application.
 */
const ALLOWED_REDIRECT_PATHS = [
    '/market',
    '/profile',
    '/messages',
    '/community',
    '/flats',
    '/notifications',
    '/wishlist',
    '/admin',
    '/auth/reset-password',
] as const

/**
 * Validates and sanitizes redirect URLs to prevent open redirect attacks.
 * Only allows relative paths that start with known safe prefixes.
 * 
 * @param next - The redirect URL from query params
 * @param defaultPath - Default path if validation fails (default: '/market')
 * @returns A safe, validated redirect path
 * 
 * @example
 * validateRedirectUrl('/market/product?id=123') // '/market/product?id=123'
 * validateRedirectUrl('https://evil.com/phishing') // '/market'
 * validateRedirectUrl('//evil.com') // '/market'
 * validateRedirectUrl(null) // '/market'
 */
export function validateRedirectUrl(next: string | null, defaultPath: string = '/market'): string {
    // No input - return default
    if (!next) return defaultPath

    // Must start with single slash (not //)
    if (!next.startsWith('/') || next.startsWith('//')) {
        return defaultPath
    }

    // Remove any protocol injection attempts
    if (next.includes(':')) {
        return defaultPath
    }

    // Extract path without query string for validation
    const pathOnly = next.split('?')[0]

    // Check against allowlist
    const isAllowed = ALLOWED_REDIRECT_PATHS.some(path => pathOnly.startsWith(path))

    return isAllowed ? next : defaultPath
}

/**
 * Development-only logger that suppresses logs in production.
 * Use this instead of console.log for auth-related debug information.
 * 
 * @param prefix - Log prefix (e.g., '[Auth Callback]')
 * @param messages - Messages to log
 */
export function authLog(prefix: string, ...messages: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
        console.log(prefix, ...messages)
    }
}

/**
 * Development-only error logger.
 * 
 * @param prefix - Log prefix
 * @param messages - Messages to log
 */
export function authError(prefix: string, ...messages: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
        console.error(prefix, ...messages)
    }
}
