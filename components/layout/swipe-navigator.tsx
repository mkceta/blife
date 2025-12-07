'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const TABS = ['/home', '/search', '/market/new', '/messages', '/profile']

export function SwipeNavigator({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return

        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe || isRightSwipe) {
            const currentIndex = TABS.findIndex(tab => pathname.startsWith(tab))
            if (currentIndex === -1) return // Not on a main tab

            if (isLeftSwipe) {
                // Next tab
                if (currentIndex < TABS.length - 1) {
                    router.push(TABS[currentIndex + 1])
                }
            } else {
                // Previous tab
                if (currentIndex > 0) {
                    router.push(TABS[currentIndex - 1])
                }
            }
        }
    }

    // Only enable swipe on main tabs to avoid interfering with horizontal scrolls (like carousels)
    // or specific pages where swipe might be annoying.
    // For now, we enable it globally but check if we are on a known tab.

    return (
        <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="min-h-screen"
        >
            {children}
        </div>
    )
}
