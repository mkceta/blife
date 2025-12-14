'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'

const routes = [
    { path: '/market', index: 0 },
    { path: '/flats', index: 0 },
    { path: '/home', index: 0 },
    { path: '/community', index: 1 },
    { path: '/search', index: 1 },
    { path: '/market/new', index: 2 },
    { path: '/messages', index: 3 },
    { path: '/profile', index: 4 },
]

export function MainTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [direction, setDirection] = useState(0)
    const prevPathname = useRef(pathname)

    // Always call useEffect before any conditional returns to maintain hook order
    useEffect(() => {
        prevPathname.current = pathname
    }, [pathname])

    // Exclude auth and landing pages from animation
    if (pathname.startsWith('/auth') || pathname === '/landing' || pathname === '/') {
        return <>{children}</>
    }

    const getIndex = (path: string) => {
        // Find the most specific match first (longest path) is not strictly needed here 
        // as our paths are distinct enough or we verify 'startsWith' carefully.
        const route = routes.find(r => path.startsWith(r.path))
        return route ? route.index : -1
    }

    // Effect to calculate direction BEFORE the render cycle that commits the new view? 
    // Actually, in React, we calculate derive state during render or use effects.
    // For simple transition, calculating during render if path changed is okay, 
    // but updating state might cause re-render. 
    // Let's use the refs logic inside render to determine immediate direction for *this* transition.

    const currentIndex = getIndex(pathname)
    const prevIndex = getIndex(prevPathname.current)

    // We only animate if we are moving between KNOWN main tabs.
    // If we are navigating deep within a tab (e.g. /market/123), index stays same, no slide.

    let currentDirection = 0
    if (currentIndex !== prevIndex && currentIndex !== -1 && prevIndex !== -1) {
        currentDirection = currentIndex > prevIndex ? 1 : -1
    }

    // Capture the direction in a ref to persist it during the EXIT animation (since pathname changes)
    // Actually Framer Motion 'custom' prop helps here.

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 1,
            zIndex: 1
        }),
        center: {
            x: 0,
            opacity: 1,
            zIndex: 0
        },
        exit: (direction: number) => ({
            x: direction > 0 ? '-20%' : '20%',
            opacity: 1, // Keep full opacity for the background layer to avoid "ghosting" transparency
            zIndex: -1
        }),
    }

    // If no direction (same tab navigation), we might just crossfade or do nothing? 
    // Let's rely on default behavior (just render) if specific inner transitions handle it.
    // But wrapping in AnimatePresence always triggers unless we conditionalize it.

    // Ideally we only use this wrapper for Main Tab switches.
    const shouldAnimate = currentDirection !== 0

    if (!shouldAnimate) {
        return <div className="min-h-screen bg-background">{children}</div>
    }

    return (
        <div className="relative min-h-screen bg-background text-foreground overflow-hidden w-full">
            <AnimatePresence mode="popLayout" custom={currentDirection} initial={false}>
                <motion.div
                    key={pathname}
                    custom={currentDirection}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        mass: 1
                    }}
                    className="absolute inset-0 w-full h-full bg-background"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
