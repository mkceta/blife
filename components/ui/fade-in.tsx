'use client'

import { motion } from 'framer-motion'

export function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut", delay }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
