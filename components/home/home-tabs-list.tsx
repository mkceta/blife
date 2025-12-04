'use client'

import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingBag, Building } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function HomeTabsList({ activeTab }: { activeTab: string }) {
    return (
        <div className="sticky top-[calc(1rem+env(safe-area-inset-top))] z-30 flex justify-center pointer-events-none px-4">
            <TabsList className="grid grid-cols-2 w-full max-w-2xl glass-strong rounded-full border border-white/10 p-1.5 pointer-events-auto shadow-xl shadow-primary/5 h-14 relative">
                <TabsTrigger
                    value="market"
                    className="relative rounded-full text-base font-medium transition-all duration-300 hover:bg-white/5 data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
                >
                    {activeTab === 'market' && (
                        <motion.div
                            layoutId="home-tab-indicator"
                            className="absolute inset-0 bg-primary rounded-full shadow-glow-primary"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className={cn(
                        "relative z-10 flex items-center gap-2 transition-colors duration-200",
                        activeTab === 'market' ? "text-primary-foreground" : "text-muted-foreground"
                    )}>
                        <ShoppingBag className="h-5 w-5" />
                        Mercadillo
                    </span>
                </TabsTrigger>

                <TabsTrigger
                    value="flats"
                    className="relative rounded-full text-base font-medium transition-all duration-300 hover:bg-white/5 data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
                >
                    {activeTab === 'flats' && (
                        <motion.div
                            layoutId="home-tab-indicator"
                            className="absolute inset-0 bg-primary rounded-full shadow-glow-primary"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className={cn(
                        "relative z-10 flex items-center gap-2 transition-colors duration-200",
                        activeTab === 'flats' ? "text-primary-foreground" : "text-muted-foreground"
                    )}>
                        <Building className="h-5 w-5" />
                        Pisos
                    </span>
                </TabsTrigger>
            </TabsList>
        </div>
    )
}
