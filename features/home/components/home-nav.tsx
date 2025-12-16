'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function HomeNav() {
    const pathname = usePathname()

    // Determine active tab based on pathname
    // /home/market -> market
    // /home/flats -> flats
    // /home -> redirects to market usually, but if we are at root, maybe default?
    const activeTab = pathname.includes('/flats') ? 'flats' : 'market'

    const tabs = [
        { id: 'market', label: 'Mercadillo', href: '/market' },
        { id: 'flats', label: 'Pisos', href: '/flats' },
    ]

    return (
        <div className="w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
            <div className="flex w-full h-12 bg-transparent p-0 rounded-none shadow-none space-x-0">
                {tabs.map((tab) => (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className="group flex-1 h-full relative flex items-center justify-center hover:bg-muted/20 transition-colors"
                    >
                        <span className={cn(
                            "relative z-10 text-sm font-semibold tracking-wide transition-colors duration-200",
                            activeTab === tab.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground/80"
                        )}>
                            {tab.label}
                        </span>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="active-tab-indicator"
                                className="absolute inset-2 bg-white/10 rounded-full"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </Link>
                ))}
            </div>
        </div>
    )
}
