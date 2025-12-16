'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Community Page Loading Skeleton
 * Matches the CommunityPage layout for seamless transitions
 */
export default function CommunityLoading() {
    return (
        <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-150">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md shadow-sm">
                <div className="pt-[calc(env(safe-area-inset-top)+0.5rem)] px-4 pb-3 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-7 w-36" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-full" />
                </div>

                {/* Category tabs skeleton */}
                <div className="flex gap-2 overflow-x-auto pb-3 px-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
                    ))}
                </div>
            </div>

            {/* Feed skeleton */}
            <div className="max-w-3xl mx-auto p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card rounded-xl border p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-20 w-full" />
                        <div className="flex gap-4">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
