'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * ProfileSkeleton - Loading state for the Profile page
 * 
 * Displays a placeholder UI that matches the ProfileContent layout
 * for a seamless loading experience
 */
export function ProfileSkeleton() {
    return (
        <div className="pb-20 bg-background min-h-screen text-foreground animate-in fade-in duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md pt-safe shadow-sm">
                <div className="flex items-center p-4">
                    <Skeleton className="h-7 w-20" />
                </div>
            </div>

            {/* User Card Skeleton */}
            <div className="px-4 pb-4 pt-0">
                <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </div>

            {/* Menu Items Skeleton */}
            <div className="px-4 space-y-1">
                {/* Seller Dashboard Button Skeleton */}
                <div className="flex items-center gap-4 p-4 rounded-lg">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-5 w-40" />
                </div>

                <div className="h-px bg-border/40 my-2 mx-4" />

                {/* Menu Items */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg">
                        <Skeleton className="h-6 w-6 rounded" />
                        <Skeleton className="h-5 w-36" />
                        <div className="flex-1" />
                        <Skeleton className="h-4 w-4" />
                    </div>
                ))}
            </div>
        </div>
    )
}
