import { Skeleton } from "@/components/ui/skeleton"

export function FeedSkeleton() {
    return (
        // Match margin/padding of MarketFeed grid container exactly
        // MarketFeed: grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-6 gap-x-4 px-3 pb-24 pt-4 auto-rows-max
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-6 gap-x-4 px-3 pb-24 pt-4 auto-rows-max">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 bg-card/40 p-2.5 rounded-xl border border-border/40">
                    {/* Image Aspect Ratio 3:4 */}
                    <Skeleton className="aspect-[3/4] w-full rounded-lg" />

                    {/* Info Section Emulating ListingCard */}
                    <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-4 w-16 rounded-md" /> {/* Price */}
                            <Skeleton className="h-3 w-8 rounded-md" />  {/* Size/Cond */}
                        </div>
                        <Skeleton className="h-3 w-3/4 rounded-md" /> {/* Brand/Title */}
                        <div className="flex gap-2 mt-1">
                            <Skeleton className="h-3 w-12 rounded-full" /> {/* Badge/Tag */}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
