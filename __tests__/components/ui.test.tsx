import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

describe('Button component', () => {
    describe('rendering', () => {
        it('renders with default props', () => {
            render(<Button>Click me</Button>)
            expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
        })

        it('renders children correctly', () => {
            render(<Button>Test Button</Button>)
            expect(screen.getByText('Test Button')).toBeInTheDocument()
        })

        it('has data-slot attribute', () => {
            render(<Button>Click</Button>)
            expect(screen.getByRole('button')).toHaveAttribute('data-slot', 'button')
        })
    })

    describe('variants', () => {
        it('applies default variant classes', () => {
            render(<Button variant="default">Default</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('bg-primary')
        })

        it('applies destructive variant classes', () => {
            render(<Button variant="destructive">Delete</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('bg-destructive')
        })

        it('applies outline variant classes', () => {
            render(<Button variant="outline">Outline</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('border')
        })

        it('applies ghost variant classes', () => {
            render(<Button variant="ghost">Ghost</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('hover:bg-accent')
        })
    })

    describe('sizes', () => {
        it('applies default size', () => {
            render(<Button size="default">Default</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('h-9')
        })

        it('applies sm size', () => {
            render(<Button size="sm">Small</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('h-8')
        })

        it('applies lg size', () => {
            render(<Button size="lg">Large</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('h-10')
        })

        it('applies icon size', () => {
            render(<Button size="icon">Icon</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('size-9')
        })
    })

    describe('states', () => {
        it('applies disabled state', () => {
            render(<Button disabled>Disabled</Button>)
            const button = screen.getByRole('button')
            expect(button).toBeDisabled()
        })

        it('applies custom className', () => {
            render(<Button className="custom-class">Custom</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('custom-class')
        })
    })
})

describe('Badge component', () => {
    describe('rendering', () => {
        it('renders with default props', () => {
            render(<Badge>New</Badge>)
            expect(screen.getByText('New')).toBeInTheDocument()
        })

        it('has data-slot attribute', () => {
            render(<Badge>Label</Badge>)
            expect(screen.getByText('Label')).toHaveAttribute('data-slot', 'badge')
        })
    })

    describe('variants', () => {
        it('applies default variant classes', () => {
            render(<Badge variant="default">Default</Badge>)
            const badge = screen.getByText('Default')
            expect(badge).toHaveClass('bg-primary')
        })

        it('applies secondary variant classes', () => {
            render(<Badge variant="secondary">Secondary</Badge>)
            const badge = screen.getByText('Secondary')
            expect(badge).toHaveClass('bg-secondary')
        })

        it('applies destructive variant classes', () => {
            render(<Badge variant="destructive">Error</Badge>)
            const badge = screen.getByText('Error')
            expect(badge).toHaveClass('bg-destructive')
        })

        it('applies outline variant classes', () => {
            render(<Badge variant="outline">Outline</Badge>)
            const badge = screen.getByText('Outline')
            expect(badge).toHaveClass('text-foreground')
        })
    })

    describe('styling', () => {
        it('applies custom className', () => {
            render(<Badge className="custom-class">Custom</Badge>)
            const badge = screen.getByText('Custom')
            expect(badge).toHaveClass('custom-class')
        })

        it('has rounded-full class', () => {
            render(<Badge>Round</Badge>)
            const badge = screen.getByText('Round')
            expect(badge).toHaveClass('rounded-full')
        })
    })
})
