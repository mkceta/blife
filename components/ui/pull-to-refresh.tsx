'use client'

import { useState, useRef } from 'react'
import { motion, useAnimation, PanInfo } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface PullToRefreshProps {
    onRefresh: () => Promise<void>
    children: React.ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const controls = useAnimation()
    const [pullY, setPullY] = useState(0)
    const [isAtTop, setIsAtTop] = useState(true)
    const THRESHOLD = 80

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget
        setIsAtTop(target.scrollTop === 0)
    }

    const handleDragEnd = async (_: any, info: PanInfo) => {
        if (info.offset.y > THRESHOLD && !isRefreshing && isAtTop) {
            setIsRefreshing(true)
            setPullY(THRESHOLD)
            await controls.start({ y: THRESHOLD })

            try {
                await onRefresh()
            } finally {
                setIsRefreshing(false)
                setPullY(0)
                await controls.start({ y: 0 })
            }
        } else {
            setPullY(0)
            controls.start({ y: 0 })
        }
    }

    const handleDrag = (_: any, info: PanInfo) => {
        if (!isRefreshing && info.offset.y > 0 && isAtTop) {
            setPullY(info.offset.y)
        }
    }

    return (
        <div className="relative h-full overflow-hidden">
            <motion.div
                className="absolute top-0 left-0 right-0 flex justify-center items-center h-20 -mt-20 z-10"
                style={{ y: pullY > 0 ? pullY / 2 : 0 }}
            >
                {isRefreshing ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                    <div
                        className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent"
                        style={{ transform: `rotate(${pullY * 2}deg)` }}
                    />
                )}
            </motion.div>

            <motion.div
                drag={isAtTop ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                onDrag={handleDrag}
                animate={controls}
                className="h-full overflow-y-auto"
                onScroll={handleScroll}
                ref={containerRef}
            >
                {children}
            </motion.div>
        </div>
    )
}
