import { Skeleton } from "@/components/ui/skeleton"

export function ProfileSkeleton() {
    return (
        <div className="pb-20 bg-background min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md pt-safe border-b border-border shadow-sm h-[60px]" />

            <div className="p-4 space-y-6">
                {/* User Card */}
                <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-4 px-2">
                    {/* Wallet Section */}
                    <div className="flex items-center gap-4 p-2">
                        <Skeleton className="h-6 w-6 rounded-md" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                    </div>
                    <div className="h-px bg-border/40 my-2 mx-4" />

                    {/* List Items */}
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-2">
                            <Skeleton className="h-6 w-6 rounded-md" />
                            <Skeleton className="h-5 w-full max-w-[200px]" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
