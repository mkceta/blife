'use client'

export function MainTransition({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground w-full overflow-auto">
            {children}
        </div>
    )
}
