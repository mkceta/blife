'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Market Page Loading Skeleton
 * Matches the MarketPage layout for seamless transitions
 */
export default function MarketLoading() {
    return (
        <div className="pb-20 bg-gradient-to-b from-primary/10 via-primary/5 to-background min-h-screen animate-in fade-in duration-150">
            <div className="p-0 md:p-4 space-y-0 max-w-7xl mx-auto">
                {/* Mobile Tabs / Nav skeleton */}
                <div className="md:hidden bg-background/95 backdrop-blur-md pt-safe sticky top-0 z-50">
                    <div className="flex items-center gap-2 p-4">
                        <Skeleton className="h-10 w-24 rounded-lg" />
                        <Skeleton className="h-10 w-24 rounded-lg" />
                    </div>
                </div>

                {/* Search bar skeleton */}
                <div className="px-3 py-2">
                    <Skeleton className="h-10 w-full rounded-full" />
                </div>

                {/* Grid skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-3 px-3 py-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-5 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
