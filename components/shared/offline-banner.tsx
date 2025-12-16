'use client'

import { useNetworkStatus } from '@/hooks/use-capacitor-init'
import { WifiOff } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * A banner that appears when the user is offline.
 * Shows a subtle notification at the top of the screen.
 */
export function OfflineBanner() {
    const { isOnline } = useNetworkStatus()

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-0 left-0 right-0 z-[9999] bg-orange-500 dark:bg-orange-600 text-white px-4 py-2 flex items-center justify-center gap-2 shadow-lg safe-area-top"
                >
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">
                        Sin conexión a Internet
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
