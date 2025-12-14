'use client'

import { createClient } from '@/lib/supabase'
import { ListingCard } from '@/components/market/listing-card'
import { FeedSkeleton } from '@/components/home/feed-skeleton'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MarketFilters as MarketFiltersType } from '@/lib/market-data'
import { useSearchParams } from 'next/navigation'
import { fetchMarketListingsAction } from '@/app/feed-actions'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useEffect } from 'react'

interface MarketFeedProps {
    initialListings?: any[]
    initialFavorites?: string[] // IDs
    initialAverageLikes?: number
    initialFilters?: MarketFiltersType
    currentUserId?: string
}

export function MarketFeed({
    initialListings = [],
    initialFavorites = [],
    initialAverageLikes = 0,
    currentUserId,
    initialFilters
}: MarketFeedProps) {
    const searchParams = useSearchParams()
    const parentRef = useRef<HTMLDivElement>(null)
    const queryClient = useQueryClient()

    // Construct filters from search params or initial props
    const filters: MarketFiltersType = {
        q: searchParams.get('q') || initialFilters?.q,
        category: searchParams.get('category') || initialFilters?.category,
        sort: searchParams.get('sort') || initialFilters?.sort,
        degree: searchParams.get('degree') || initialFilters?.degree,
        size: searchParams.get('size') || initialFilters?.size,
        minPrice: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : initialFilters?.minPrice,
        maxPrice: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : initialFilters?.maxPrice,
    }

    const { data: listings, refetch } = useQuery({
        queryKey: ['market-listings', filters, currentUserId],
        queryFn: async () => {
            // Use Server Action here
            const raw = await fetchMarketListingsAction(filters)

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
        initialData: initialListings.length > 0 ? initialListings : undefined,
        initialDataUpdatedAt: initialListings.length > 0 ? Date.now() : undefined,
        staleTime: 1000 * 60 * 10, // 10 minutes cache
    })

    // Make favorites reactive with React Query
    const { data: favorites = initialFavorites } = useQuery({
        queryKey: ['favorites', currentUserId],
        queryFn: async () => {
            if (!currentUserId) return []
            const supabase = createClient()
            const { data } = await supabase
                .from('favorites')
                .select('listing_id')
                .eq('user_id', currentUserId)
            return data?.map(f => f.listing_id) || []
        },
        initialData: initialFavorites,
        enabled: !!currentUserId,
        staleTime: 1000 * 60, // 1 minute
    })

    const favoritesSet = new Set(favorites)

    // Virtual scrolling setup
    const columnCount = typeof window !== 'undefined' && window.innerWidth >= 1024 ? 5 :
        typeof window !== 'undefined' && window.innerWidth >= 768 ? 3 : 2

    const rowVirtualizer = useVirtualizer({
        count: Math.ceil((listings?.length || 0) / columnCount),
        getScrollElement: () => parentRef.current,
        estimateSize: () => 320, // Measured closer to mobile height
        overscan: 2,
    })

    console.log('MarketFeed Listings State:', {
        listingsCount: listings?.length,
        firstPrice: listings?.[0]?.price_cents
    })

    return (
        <>
            <PullToRefresh onRefresh={async () => { await refetch() }}>
                <div
                    ref={parentRef}
                    className="min-h-[calc(100vh-10rem)] bg-transparent overflow-auto"
                    style={{ height: '100%' }}
                >
                    {/* Vinted style grid: tighter gaps, 2 cols on mobile, 5 on desktop */}
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const startIndex = virtualRow.index * columnCount
                            const rowListings = listings?.slice(startIndex, startIndex + columnCount) || []

                            return (
                                <div
                                    key={virtualRow.key}
                                    data-index={virtualRow.index}
                                    ref={rowVirtualizer.measureElement}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-4 px-3 py-2">
                                        {rowListings.map((listing, colIndex) => {
                                            const index = startIndex + colIndex
                                            return (
                                                <motion.div
                                                    key={listing.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: Math.min(colIndex * 0.02, 0.1) }}
                                                >
                                                    <ListingCard
                                                        listing={listing}
                                                        currentUserId={currentUserId}
                                                        isFavorited={favoritesSet.has(listing.id)}
                                                        priority={index < 4}
                                                        averageLikes={initialAverageLikes}
                                                    />
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {(!listings || listings.length === 0) && (
                        <div className="text-center py-20 text-muted-foreground">
                            No hay anuncios todavía.
                        </div>
                    )}
                </div>
            </PullToRefresh>

            {/* CLIENT DEBUG BANNER */}
            <div className="fixed bottom-20 left-4 z-[9999] bg-black/90 text-red-400 p-4 rounded-lg font-mono text-xs border border-red-500/50 shadow-2xl pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
                <div className="font-bold mb-1 text-white border-b border-white/20 pb-1">CLIENT SIDE DEBUG</div>
                <div>Constructed Sort: <span className="text-yellow-400">{filters.sort || 'None'}</span></div>
                <div>Listings Count: {listings?.length}</div>
                <div>1st Price: <span className="text-xl font-bold">{listings?.[0]?.price_cents}</span></div>
                <div className="mt-1 text-muted-foreground">Params Sort: {searchParams.get('sort')}</div>
            </div>
        </>
    )
}
