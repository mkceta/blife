'use client'

import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function HomeTabsList({ activeTab }: { activeTab: string }) {
    return (
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 w-full bg-background/95 backdrop-blur-md border-b border-border/40">
            <TabsList className="flex w-full h-12 bg-transparent p-0 rounded-none shadow-none space-x-0">
                <TabsTrigger
                    value="market"
                    className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 transition-none"
                >
                    <span className={cn(
                        "text-sm font-medium transition-colors",
                        activeTab === 'market' ? "text-primary" : "text-muted-foreground"
                    )}>
                        Mercadillo
                    </span>
                </TabsTrigger>
                <TabsTrigger
                    value="flats"
                    className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 transition-none"
                >
                    <span className={cn(
                        "text-sm font-medium transition-colors",
                        activeTab === 'flats' ? "text-primary" : "text-muted-foreground"
                    )}>
                        Pisos
                    </span>
                </TabsTrigger>
            </TabsList>
        </div>
    )
}
