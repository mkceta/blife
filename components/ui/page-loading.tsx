'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Page loading indicator that shows during route transitions
 * Appears at the top of the screen like a progress bar
 */
export function PageLoadingIndicator() {
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Start loading animation
        setIsLoading(true)
        setProgress(0)

        // Simulate progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval)
                    return 90
                }
                return prev + 10
            })
        }, 50)

        // Complete loading after a short delay
        const timeout = setTimeout(() => {
            setProgress(100)
            setTimeout(() => setIsLoading(false), 300)
        }, 400)

        return () => {
            clearInterval(interval)
            clearTimeout(timeout)
        }
    }, [pathname])

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gradient-to-r from-primary via-primary/80 to-primary"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: progress / 100, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{ transformOrigin: 'left' }}
                >
                    {/* Shimmer effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{
                            x: ['-100%', '200%'],
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

/**
 * Full-screen page transition overlay
 * For more dramatic transitions between major sections
 */
export function PageTransitionOverlay() {
    const pathname = usePathname()
    const [isTransitioning, setIsTransitioning] = useState(false)

    useEffect(() => {
        setIsTransitioning(true)
        const timeout = setTimeout(() => setIsTransitioning(false), 600)
        return () => clearTimeout(timeout)
    }, [pathname])

    return (
        <AnimatePresence>
            {isTransitioning && (
                <motion.div
                    className="fixed inset-0 z-[9998] bg-background pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, times: [0, 0.3, 1] }}
                />
            )}
        </AnimatePresence>
    )
}

/**
 * Skeleton loader for page content
 * Shows while page is transitioning
 */
export function PageSkeleton() {
    return (
        <div className="animate-pulse space-y-4 p-4">
            <div className="h-8 bg-muted rounded-lg w-1/3" />
            <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="h-40 bg-muted rounded-xl" />
                <div className="h-40 bg-muted rounded-xl" />
                <div className="h-40 bg-muted rounded-xl" />
                <div className="h-40 bg-muted rounded-xl" />
            </div>
        </div>
    )
}
