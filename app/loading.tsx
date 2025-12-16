'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Global Loading Skeleton
 * 
 * This is automatically shown by Next.js when navigating between pages
 * that have async Server Components. It provides instant visual feedback.
 * 
 * Uses a generic feed-like skeleton that works for most pages.
 */
export default function Loading() {
    return (
        <div className="min-h-screen bg-background animate-in fade-in duration-150">
            {/* Header skeleton */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md pt-safe shadow-sm">
                <div className="flex items-center justify-between p-4">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>

            {/* Content skeleton - Grid layout like Market/Flats */}
            <div className="p-4 space-y-4">
                {/* Search bar skeleton */}
                <Skeleton className="h-10 w-full rounded-full" />

                {/* Grid skeleton */}
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
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
