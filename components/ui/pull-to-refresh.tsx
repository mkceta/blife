'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { refreshHaptic, lightHaptic } from '@/lib/haptics'

interface PullToRefreshProps {
    onRefresh: () => Promise<void>
    children: React.ReactNode
    scrollContainerRef?: React.RefObject<any>
}

export function PullToRefresh({ onRefresh, children, scrollContainerRef }: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [pullY, setPullY] = useState(0)
    const startY = useRef(0)
    const isDragging = useRef(false)
    const contentControls = useAnimation()
    const THRESHOLD = 80

    // Reset pull when refresh ends
    useEffect(() => {
        if (!isRefreshing) {
            setPullY(0)
            contentControls.start({ y: 0 })
        }
    }, [isRefreshing, contentControls])

    const getScrollTop = () => {
        if (scrollContainerRef?.current) {
            return scrollContainerRef.current.scrollTop
        }
        return window.scrollY
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        if (getScrollTop() <= 0) {
            startY.current = e.touches[0].clientY
            isDragging.current = true
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return

        // If user scrolls down, stop tracking pull
        if (getScrollTop() > 0) {
            isDragging.current = false
            setPullY(0)
            contentControls.start({ y: 0 })
            return
        }

        const currentY = e.touches[0].clientY
        const diff = currentY - startY.current

        if (diff > 0) {
            // Add resistance
            const damped = Math.min(diff * 0.5, THRESHOLD * 1.5)
            setPullY(damped)
            contentControls.start({ y: damped, transition: { duration: 0 } })

            // Prevent default only if we are pulling down significantly to avoid interfering with horizontal swipes
            if (diff > 10 && e.cancelable) {
                // e.preventDefault()
            }
        }
    }

    const handleTouchEnd = async () => {
        isDragging.current = false

        if (pullY > THRESHOLD && !isRefreshing) {
            setIsRefreshing(true)
            // Snap to threshold
            contentControls.start({ y: THRESHOLD })

            // Haptic feedback when refresh is triggered
            lightHaptic()

            try {
                await onRefresh()
                // Success haptic pattern after refresh completes
                refreshHaptic()
            } finally {
                setIsRefreshing(false)
            }
        } else {
            // Snap back
            setPullY(0)
            contentControls.start({ y: 0 })
        }
    }

    return (
        <div
            className="relative h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Loading Indicator - Positioned absolutely at the top */}
            <div
                className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-0"
                style={{
                    height: THRESHOLD,
                    opacity: pullY > 0 ? 1 : 0,
                    transition: 'opacity 0.2s'
                }}
            >
                {isRefreshing ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                    <div
                        className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent"
                        style={{
                            transform: `rotate(${pullY * 3}deg)`,
                            opacity: Math.min(pullY / THRESHOLD, 1)
                        }}
                    />
                )}
            </div>

            {/* Content Wrapper - This moves down */}
            <motion.div
                animate={contentControls}
                className="relative z-10 bg-transparent h-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {children}
            </motion.div>
        </div>
    )
}
