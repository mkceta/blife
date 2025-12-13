'use client'

import { createClient } from '@/lib/supabase'
import { ListingCard } from '@/components/market/listing-card'
import { FeedSkeleton } from '@/components/home/feed-skeleton'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { getCachedMarketListings } from '@/lib/market-data'
import { MarketFilters as MarketFiltersType } from '@/lib/market-data'
import { useSearchParams } from 'next/navigation'

interface MarketFeedProps {
    initialListings?: any[]
    initialFavorites?: string[] // IDs
    initialAverageLikes?: number
    currentUserId?: string
}

export function MarketFeed({
    initialListings = [],
    initialFavorites = [],
    initialAverageLikes = 0,
    currentUserId
}: MarketFeedProps) {
    const searchParams = useSearchParams()

    // Construct filters from search params
    const getFilters = (): MarketFiltersType => ({
        q: searchParams.get('q') || undefined,
        category: searchParams.get('category') || undefined,
        sort: searchParams.get('sort') || undefined,
        degree: searchParams.get('degree') || undefined,
        size: searchParams.get('size') || undefined,
        minPrice: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
        maxPrice: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
    })

    const filters = getFilters()

    const { data: listings, isLoading, refetch } = useQuery({
        queryKey: ['market-listings', filters, currentUserId],
        queryFn: async () => {
            const raw = await getCachedMarketListings(filters)

            // Filter own listings
            let processed = currentUserId ? raw.filter(l => l.user_id !== currentUserId) : raw

            // Shuffle if 'recommended' or default
            if (!filters.sort || filters.sort === 'recommended') {
                for (let i = processed.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [processed[i], processed[j]] = [processed[j], processed[i]];
                }
            }
            return processed
        },
        initialData: initialListings,
        staleTime: 1000 * 60 * 2, // 2 minutes
    })

    const favoritesSet = new Set(initialFavorites)

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-10rem)] bg-transparent pt-4 px-3">
                <FeedSkeleton />
            </div>
        )
    }

    return (
        <PullToRefresh onRefresh={async () => { await refetch() }}>
            <div className="min-h-[calc(100vh-10rem)] bg-transparent">
                {/* Vinted style grid: tighter gaps, 2 cols on mobile, 5 on desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-6 gap-x-4 px-3 pb-24 pt-4 auto-rows-max">
                    {listings && listings.map((listing, index) => (
                        <motion.div
                            key={listing.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
                        >
                            <ListingCard
                                listing={listing}
                                currentUserId={currentUserId}
                                isFavorited={favoritesSet.has(listing.id)}
                                priority={index < 4}
                                averageLikes={initialAverageLikes}
                            />
                        </motion.div>
                    ))}
                </div>

                {(!listings || listings.length === 0) && (
                    <div className="text-center py-20 text-muted-foreground">
                        No hay anuncios todavía.
                    </div>
                )}
            </div>
        </PullToRefresh>
    )
}
