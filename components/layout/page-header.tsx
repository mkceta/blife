'use client'

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface PageHeaderProps {
    title: string
    icon?: React.ReactNode
    children?: React.ReactNode
    className?: string
}

export function PageHeader({ title, icon, children, className }: PageHeaderProps) {
    return (
        <>
            {/* Background Gradient Blob */}
            <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10 pointer-events-none" />

            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                    "sticky top-4 z-30 mx-auto w-full", // Floating positioning
                    "glass-strong rounded-full border border-white/20 shadow-lg shadow-black/5", // Glass & Shape
                    "px-6 py-3 mb-8", // Spacing
                    "flex items-center justify-between gap-4", // Layout
                    className || "max-w-3xl" // Default width if not provided
                )}
            >
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-inner">
                            {icon}
                        </div>
                    )}
                    <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        {title}
                    </h1>
                </div>
                {children}
            </motion.div>
        </>
    )
}
