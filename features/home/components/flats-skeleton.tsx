import { Skeleton } from "@/components/ui/skeleton"

export function FlatsSkeleton() {
    return (
        // Match FlatsFeed grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-24 pt-4
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-24 pt-4">
            {Array.from({ length: 9 }).map((_, i) => (
                // Match FlatCard outer structure usually has a border and rounded-xl
                <div key={i} className="flex flex-col bg-card rounded-xl border border-border/40 overflow-hidden h-[300px]">
                    {/* Image Carousel Area */}
                    <Skeleton className="h-[180px] w-full" />

                    {/* Content Area */}
                    <div className="p-4 flex flex-col gap-2 flex-1">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-6 w-3/4 rounded-md" /> {/* Title */}
                            <Skeleton className="h-6 w-20 rounded-md" /> {/* Price */}
                        </div>
                        <Skeleton className="h-4 w-1/2 rounded-md" /> {/* Address/Location */}

                        <div className="flex gap-4 mt-auto">
                            <Skeleton className="h-4 w-16 rounded-md" /> {/* Beds */}
                            <Skeleton className="h-4 w-16 rounded-md" /> {/* Baths */}
                            <Skeleton className="h-4 w-16 rounded-md" /> {/* Area */}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
