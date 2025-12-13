'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

// Define page hierarchy for slide direction
const PAGE_HIERARCHY: Record<string, number> = {
    '/landing': 0,
    '/auth': 1,
    '/market': 2,
    '/community': 3,
    '/messages': 4,
    '/profile': 5,
    '/search': 6,
    '/wishlist': 7,
}

// Get base path for hierarchy comparison
function getBasePath(path: string): string {
    const cleanPath = path.split('?')[0].split('#')[0]
    const segments = cleanPath.split('/').filter(Boolean)
    if (segments.length === 0) return '/market'
    const basePath = `/${segments[0]}`
    return basePath
}

// Determine slide direction based on navigation
function getSlideDirection(from: string, to: string): 'left' | 'right' | 'none' {
    const fromIndex = PAGE_HIERARCHY[from] ?? -1
    const toIndex = PAGE_HIERARCHY[to] ?? -1
    if (fromIndex === -1 || toIndex === -1) return 'none'
    return toIndex > fromIndex ? 'left' : 'right'
}

export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [prevPath, setPrevPath] = useState(pathname)
    const [direction, setDirection] = useState<'left' | 'right' | 'none'>('none')

    useEffect(() => {
        if (pathname !== prevPath) {
            const fromBase = getBasePath(prevPath)
            const toBase = getBasePath(pathname)
            const slideDir = getSlideDirection(fromBase, toBase)
            setDirection(slideDir)
            setPrevPath(pathname)
        }
    }, [pathname, prevPath])

    // Slide variants - optimized for natural fluid motion
    // Using percentage for slide distance to adapt to screen size
    const slideVariants = {
        enter: (direction: 'left' | 'right' | 'none') => ({
            x: direction === 'left' ? '8%' : direction === 'right' ? '-8%' : 0,
            opacity: 0,
            zIndex: 1, // Ensure entering page is on top
        }),
        center: {
            x: 0,
            opacity: 1,
            zIndex: 1,
        },
        exit: (direction: 'left' | 'right' | 'none') => ({
            x: direction === 'left' ? '-8%' : direction === 'right' ? '8%' : 0,
            opacity: 0,
            zIndex: 0, // Exiting page goes back
        }),
    }

    // Fade-only variants for detail pages
    const fadeVariants = {
        enter: {
            opacity: 0,
            zIndex: 1,
        },
        center: {
            opacity: 1,
            zIndex: 1,
        },
        exit: {
            opacity: 0,
            zIndex: 0,
        },
    }

    const isDetailPage = pathname.includes('/product/') ||
        pathname.includes('/post/') ||
        pathname.includes('/user/') ||
        pathname.includes('/edit') ||
        pathname.includes('/new')

    const variants = isDetailPage ? fadeVariants : slideVariants

    return (
        <div className="relative w-full bg-background">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div
                    key={pathname}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        // Using cubic-bezier for a more "solid" and predictable native-like feel
                        // This avoids the "jiggle" or "cut-off" feeling of some springs
                        ease: [0.25, 1, 0.5, 1],
                        duration: 0.35
                    }}
                    className="w-full min-h-screen bg-background"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
