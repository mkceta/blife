'use client'

import { motion, PanInfo, useAnimation } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { ReactNode, useState } from 'react'

interface SwipeablePageProps {
    children: ReactNode
    previousPage?: string
    nextPage?: string
    enabled?: boolean
}

/**
 * Swipeable page component for gesture-based navigation
 * Swipe right to go back, swipe left to go forward
 */
export function SwipeablePage({
    children,
    previousPage,
    nextPage,
    enabled = true,
}: SwipeablePageProps) {
    const router = useRouter()
    const pathname = usePathname()
    const controls = useAnimation()
    const [isDragging, setIsDragging] = useState(false)

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false)
        const threshold = 100 // pixels
        const velocity = info.velocity.x

        // Swipe right (go back)
        if (info.offset.x > threshold || velocity > 500) {
            if (previousPage) {
                controls.start({
                    x: window.innerWidth,
                    opacity: 0,
                    transition: { duration: 0.3, ease: 'easeOut' },
                })
                setTimeout(() => router.push(previousPage), 100)
            } else {
                // Bounce back
                controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } })
            }
        }
        // Swipe left (go forward)
        else if (info.offset.x < -threshold || velocity < -500) {
            if (nextPage) {
                controls.start({
                    x: -window.innerWidth,
                    opacity: 0,
                    transition: { duration: 0.3, ease: 'easeOut' },
                })
                setTimeout(() => router.push(nextPage), 100)
            } else {
                // Bounce back
                controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } })
            }
        }
        // Not enough swipe, bounce back
        else {
            controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } })
        }
    }

    if (!enabled) {
        return <>{children}</>
    }

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            animate={controls}
            className="h-full w-full"
            style={{
                cursor: isDragging ? 'grabbing' : 'grab',
            }}
        >
            {children}
        </motion.div>
    )
}

/**
 * Hook to get navigation context for current page
 */
export function usePageNavigation() {
    const pathname = usePathname()

    // Define navigation flow
    const navigationFlow: Record<string, { prev?: string; next?: string }> = {
        '/market': { next: '/community' },
        '/community': { prev: '/market', next: '/messages' },
        '/messages': { prev: '/community', next: '/profile' },
        '/profile': { prev: '/messages' },
    }

    return navigationFlow[pathname] || {}
}
