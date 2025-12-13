'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Heart } from 'lucide-react'
import { ListingCard } from '@/components/market/listing-card'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'

interface WishlistClientProps {
    initialItems: any[]
}

export default function WishlistClient({ initialItems }: WishlistClientProps) {
    const router = useRouter()
    const supabase = createClient()

    // We can use state to manage updates if we want to allow refetching or filtering locally
    // For now, initialItems is enough for "instant load"

    // Optional: Re-fetch on pull-to-refresh
    const handleRefresh = async () => {
        router.refresh()
    }

    return (
        <div className="flex flex-col h-full bg-background min-h-screen pb-20 md:pb-0">
            {/* Header matching Messages/Notifications style */}
            <div className="flex flex-col border-b border-border/50 bg-background pt-[calc(env(safe-area-inset-top)+1rem)] sticky top-0 z-30">
                <div className="px-4 pb-4">
                    <h2 className="text-xl font-bold">Favoritos ({initialItems.length})</h2>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <PullToRefresh onRefresh={handleRefresh}>
                    <div className="h-full overflow-y-auto p-4 scrollbar-thin">
                        {initialItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Heart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                <p className="text-lg mb-2">Tu lista de favoritos está vacía</p>
                                <p className="text-sm">Guarda lo que te guste para verlo aquí</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {initialItems.map((listing: any) => {
                                        return (
                                            <ListingCard
                                                key={listing.id}
                                                listing={listing}
                                                isFavorited={true}
                                            />
                                        )
                                    })}
                                </div>
                                <div className="h-24 md:h-0" /> {/* Spacer */}
                            </>
                        )}
                    </div>
                </PullToRefresh>
            </div>
        </div>
    )
}
