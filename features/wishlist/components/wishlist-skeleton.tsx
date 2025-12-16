import { Skeleton } from "@/components/ui/skeleton"

export function WishlistSkeleton() {
    return (
        <div className="flex flex-col h-full bg-background min-h-screen pb-20 md:pb-0">
            <div className="flex flex-col border-b border-border/50 bg-background pt-[calc(env(safe-area-inset-top)+1rem)] sticky top-0 z-30">
                <div className="px-4 pb-4">
                    <Skeleton className="h-7 w-32" />
                </div>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="aspect-square w-full rounded-xl" />
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-10" />
                            </div>
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
