import React, { Component, ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

/**
 * Error Boundary component to catch React errors in the tree below
 * Prevents the whole app from crashing when a component fails
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="min-h-screen flex items-center justify-center bg-background p-4">
                        <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center">
                            <h2 className="text-xl font-bold text-foreground mb-2">
                                Algo salió mal
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                Ha ocurrido un error inesperado. Por favor, recarga la página.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition"
                            >
                                Recargar página
                            </button>
                        </div>
                    </div>
                )
            )
        }

        return this.props.children
    }
}
