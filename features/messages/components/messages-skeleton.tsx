import { Skeleton } from "@/components/ui/skeleton"

export function MessagesSkeleton() {
    return (
        <div className="h-full w-full bg-background flex flex-col">
            {/* Header */}
            <div className="h-14 border-b border-border flex items-center px-4 gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-6 w-32" />
            </div>

            {/* List */}
            <div className="flex-1 p-0 space-y-0">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 border-b border-border/40">
                        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2 overflow-hidden">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-12" />
                            </div>
                            <Skeleton className="h-3 w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
