'use client'

import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function HomeTabsList({ activeTab }: { activeTab: string }) {
    const tabs = [
        { id: 'market', label: 'Mercadillo' },
        { id: 'flats', label: 'Pisos' },
    ]

    return (
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
            <TabsList className="flex w-full h-12 bg-transparent p-0 rounded-none shadow-none space-x-0">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="group flex-1 h-full relative rounded-none border-none data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 hover:bg-muted/20 transition-colors"
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
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </TabsTrigger>
                ))}
            </TabsList>
        </div>
    )
}
