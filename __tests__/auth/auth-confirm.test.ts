import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Next.js server modules
vi.mock('next/headers', () => ({
    cookies: () => ({
        getAll: () => [],
        set: vi.fn(),
    }),
}))

// Mock Supabase server client
const mockExchangeCodeForSession = vi.fn()

vi.mock('@supabase/ssr', () => ({
    createServerClient: () => ({
        auth: {
            exchangeCodeForSession: mockExchangeCodeForSession,
        },
    }),
}))

describe('Auth Confirm Route Handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('redirects to forgot-password with error=expired when otp_expired', async () => {
        // Import the route handler
        const { GET } = await import('@/app/auth/confirm/route')

        const request = new Request(
            'https://example.com/auth/confirm?error=access_denied&error_code=otp_expired&error_description=Token+expired'
        )

        const response = await GET(request)

        expect(response.status).toBe(307) // Redirect status
        expect(response.headers.get('location')).toContain('/auth/forgot-password?error=expired')
    })

    it('redirects to login with error when other errors occur', async () => {
        const { GET } = await import('@/app/auth/confirm/route')

        const request = new Request(
            'https://example.com/auth/confirm?error=server_error&error_description=Something+went+wrong'
        )

        const response = await GET(request)

        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toContain('/auth/login?error=')
    })

    it('exchanges code and redirects to reset-password when next includes reset-password', async () => {
        mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })

        const { GET } = await import('@/app/auth/confirm/route')

        const request = new Request(
            'https://example.com/auth/confirm?code=test-auth-code&next=/auth/reset-password'
        )

        const response = await GET(request)

        expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-auth-code')
        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toContain('/auth/reset-password')
    })

    it('exchanges code and redirects to market by default', async () => {
        mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })

        const { GET } = await import('@/app/auth/confirm/route')

        const request = new Request(
            'https://example.com/auth/confirm?code=test-auth-code'
        )

        const response = await GET(request)

        expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-auth-code')
        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toContain('/market')
    })

    it('redirects to forgot-password when code exchange fails', async () => {
        mockExchangeCodeForSession.mockResolvedValueOnce({
            error: { message: 'Invalid code' }
        })

        const { GET } = await import('@/app/auth/confirm/route')

        const request = new Request(
            'https://example.com/auth/confirm?code=invalid-code&next=/auth/reset-password'
        )

        const response = await GET(request)

        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toContain('/auth/forgot-password?error=invalid_link')
    })

    it('redirects to home when no code is provided', async () => {
        const { GET } = await import('@/app/auth/confirm/route')

        const request = new Request('https://example.com/auth/confirm')

        const response = await GET(request)

        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toBe('/')
    })
})

describe('Auth Confirm URL Parameter Handling', () => {
    it('preserves the next parameter for successful redirects', async () => {
        mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })

        const { GET } = await import('@/app/auth/confirm/route')

        const request = new Request(
            'https://example.com/auth/confirm?code=test-code&next=/profile'
        )

        const response = await GET(request)

        expect(response.headers.get('location')).toContain('/profile')
    })
})
