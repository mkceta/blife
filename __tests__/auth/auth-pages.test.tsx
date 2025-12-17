import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Import components after mocks are set up
import LoginPage from '@/app/auth/login/page'
import ForgotPasswordPage from '@/app/auth/forgot-password/page'
import ResetPasswordPage from '@/app/auth/reset-password/page'

// Get mocked modules
const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
}

vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
}))

describe('Auth Pages', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('LoginPage', () => {
        it('renders login form with email input', () => {
            render(<LoginPage />)

            expect(screen.getByPlaceholderText(/usuario@udc.es/i)).toBeInTheDocument()
        })

        it('renders submit button', () => {
            render(<LoginPage />)

            expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
        })

        it('shows forgot password link', () => {
            render(<LoginPage />)

            expect(screen.getByText(/¿olvidaste tu contraseña/i)).toBeInTheDocument()
        })

        it('shows register link', () => {
            render(<LoginPage />)

            expect(screen.getByText(/regístrate/i)).toBeInTheDocument()
        })

        it('shows page title', () => {
            render(<LoginPage />)

            expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument()
        })
    })

    describe('ForgotPasswordPage', () => {
        it('renders forgot password form', () => {
            render(<ForgotPasswordPage />)

            expect(screen.getByPlaceholderText(/usuario@udc.es/i)).toBeInTheDocument()
        })

        it('shows submit button', () => {
            render(<ForgotPasswordPage />)

            expect(screen.getByRole('button', { name: /enviar enlace/i })).toBeInTheDocument()
        })

        it('shows back to login link', () => {
            render(<ForgotPasswordPage />)

            expect(screen.getByText(/volver al login/i)).toBeInTheDocument()
        })

        it('validates email must be UDC domain', async () => {
            const user = userEvent.setup()
            render(<ForgotPasswordPage />)

            const emailInput = screen.getByPlaceholderText(/usuario@udc.es/i)
            await user.type(emailInput, 'test@gmail.com')

            const submitButton = screen.getByRole('button', { name: /enviar enlace/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/solo se permiten correos @udc/i)).toBeInTheDocument()
            })
        })

        it('shows page title', () => {
            render(<ForgotPasswordPage />)

            expect(screen.getByText(/recuperar contraseña/i)).toBeInTheDocument()
        })
    })

    describe('ResetPasswordPage', () => {
        it('renders loading state initially', () => {
            render(<ResetPasswordPage />)

            expect(screen.getByText(/verificando/i)).toBeInTheDocument()
        })

        it('shows logo', () => {
            render(<ResetPasswordPage />)

            expect(screen.getByAltText(/blife logo/i)).toBeInTheDocument()
        })
    })
})
