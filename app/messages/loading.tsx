'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Messages Page Loading Skeleton
 */
export default function MessagesLoading() {
    return (
        <div className="min-h-screen bg-background animate-in fade-in duration-150">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md pt-safe shadow-sm">
                <div className="flex items-center p-4">
                    <Skeleton className="h-7 w-28" />
                </div>
            </div>

            {/* Search bar */}
            <div className="px-4 py-2">
                <Skeleton className="h-10 w-full rounded-full" />
            </div>

            {/* Message threads skeleton */}
            <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-3 w-10" />
                    </div>
                ))}
            </div>
        </div>
    )
}
