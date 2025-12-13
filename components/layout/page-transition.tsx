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

    // Slide variants - optimized for super fluid transitions
    const slideVariants = {
        enter: (direction: 'left' | 'right' | 'none') => ({
            x: direction === 'left' ? 15 : direction === 'right' ? -15 : 0,
            opacity: 0,
            scale: 0.995,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: 'left' | 'right' | 'none') => ({
            x: direction === 'left' ? -15 : direction === 'right' ? 15 : 0,
            opacity: 0,
            scale: 0.995,
        }),
    }

    // Fade-only variants for detail pages - ultra fast
    const fadeVariants = {
        enter: {
            opacity: 0,
            scale: 0.995,
        },
        center: {
            opacity: 1,
            scale: 1,
        },
        exit: {
            opacity: 0,
            scale: 0.995,
        },
    }

    const isDetailPage = pathname.includes('/product/') ||
        pathname.includes('/post/') ||
        pathname.includes('/user/') ||
        pathname.includes('/edit') ||
        pathname.includes('/new')

    const variants = isDetailPage ? fadeVariants : slideVariants

    return (
        <div className="relative w-full overflow-x-hidden">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div
                    key={pathname}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        type: 'spring',
                        stiffness: 600,
                        damping: 40,
                        mass: 0.4,
                    }}
                    className="w-full min-h-screen bg-background"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
