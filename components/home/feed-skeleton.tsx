import { Skeleton } from "@/components/ui/skeleton"

export function FeedSkeleton() {
    return (
        <div className="space-y-6">
            {/* Search Bar Skeleton */}
            <div className="sticky top-[calc(4.5rem+env(safe-area-inset-top))] z-20 mx-auto max-w-2xl w-full mb-6 px-4 md:px-0 pt-2 bg-black/95 backdrop-blur-sm pb-2 rounded-b-xl shadow-sm">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-full rounded-md bg-card/50" />
                    <Skeleton className="h-10 w-10 rounded-md bg-card/50" />
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="aspect-square w-full rounded-xl bg-card/50" />
                        <div className="space-y-2 px-1">
                            <Skeleton className="h-4 w-3/4 bg-card/50" />
                            <Skeleton className="h-3 w-1/2 bg-card/50" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
