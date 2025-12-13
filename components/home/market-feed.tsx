'use client'

import { createClient } from '@/lib/supabase'
import { ListingCard } from '@/components/market/listing-card'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { motion, AnimatePresence } from 'framer-motion'
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

    const { data: listings = initialListings, refetch } = useQuery({
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

    return (
        <PullToRefresh onRefresh={async () => { await refetch() }}>
            <div className="min-h-[calc(100vh-10rem)] bg-transparent">
                {/* Vinted style grid: tighter gaps, 2 cols on mobile, 5 on desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-6 gap-x-4 px-3 pb-24 pt-4 auto-rows-max">
                    <AnimatePresence mode="popLayout">
                        {listings && listings.map((listing, index) => (
                            <motion.div
                                key={listing.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                transition={{
                                    duration: 0.3,
                                    delay: index < 10 ? index * 0.03 : 0,
                                    layout: { duration: 0.3 }
                                }}
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
                    </AnimatePresence>
                </div>

                {(!listings || listings.length === 0) && (
                    <motion.div
                        className="text-center py-20 text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        No hay anuncios todavía.
                    </motion.div>
                )}
            </div>
        </PullToRefresh>
    )
}
