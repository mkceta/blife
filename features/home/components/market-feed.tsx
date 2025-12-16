'use client'

import { createClient } from '@/lib/supabase/client'
import { ListingCard } from '@/features/market/components/listing-card'
import { FeedSkeleton } from '@/features/home/components/feed-skeleton'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { MarketFilters as MarketFiltersType } from '@/lib/services/market.service'
import { fetchMarketListingsAction } from '@/app/feed-actions'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useEffect, useState, useMemo } from 'react'
import { CACHE_KEYS } from '@/lib/cache-keys'
import { Loader2 } from 'lucide-react'

import type { Listing } from '@/lib/types'

interface MarketFeedProps {
    initialListings?: Listing[]
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
    const parentRef = useRef<HTMLDivElement>(null)
    const queryClient = useQueryClient()
    const supabase = useMemo(() => createClient(), [])
    const [clientSearchParams, setClientSearchParams] = useState<URLSearchParams | null>(null)
    const [columnCount, setColumnCount] = useState(2)

    // Get search params on client side
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setClientSearchParams(new URLSearchParams(window.location.search))
        }
    }, [])

    // Responsive columns
    useEffect(() => {
        const updateColumns = () => {
            setColumnCount(window.innerWidth >= 1024 ? 5 : window.innerWidth >= 768 ? 3 : 2)
        }
        updateColumns()
        window.addEventListener('resize', updateColumns)
        return () => window.removeEventListener('resize', updateColumns)
    }, [])

    // Fetch current user
    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            return user
        },
        staleTime: 1000 * 60 * 5,
    })

    const actualCurrentUserId = user?.id || currentUserId

    // Filters
    const filters: MarketFiltersType = useMemo(() => ({
        q: clientSearchParams?.get('q') || initialFilters?.q,
        category: clientSearchParams?.get('category') || initialFilters?.category,
        sort: clientSearchParams?.get('sort') || initialFilters?.sort,
        degree: clientSearchParams?.get('degree') || initialFilters?.degree,
        size: clientSearchParams?.get('size') || initialFilters?.size,
        minPrice: clientSearchParams?.get('min_price') ? parseFloat(clientSearchParams.get('min_price')!) : initialFilters?.minPrice,
        maxPrice: clientSearchParams?.get('max_price') ? parseFloat(clientSearchParams.get('max_price')!) : initialFilters?.maxPrice,
    }), [clientSearchParams, initialFilters])

    // Infinite Query Implementation
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isPending
    } = useInfiniteQuery({
        queryKey: CACHE_KEYS.market.listings(filters),
        queryFn: async ({ pageParam = 1 }) => {
            return await fetchMarketListingsAction({ ...filters, page: pageParam as number, limit: 20 })
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            // If last page has fewer than limit items, we reached the end
            return lastPage.length === 20 ? allPages.length + 1 : undefined
        },
        // Always provide initialData if we have server data, regardless of filters
        // This prevents blank screens when server cache fails
        initialData: initialListings.length > 0 ? {
            pages: [initialListings],
            pageParams: [1]
        } : undefined,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        // Crucial: Always refetch on mount if no initial data
        refetchOnMount: initialListings.length === 0 ? 'always' : false,
    })

    // Flatten pages into a single array
    const listings = useMemo(() => {
        if (!data) return initialListings.length > 0 ? initialListings : []
        return data.pages.flatMap((page) => page) || []
    }, [data, initialListings])

    // Filter own listings if needed (e.g. for recommendations)
    const filteredListings = useMemo(() => {
        if (!actualCurrentUserId) return listings
        return listings.filter(l => l.user_id !== actualCurrentUserId)
    }, [listings, actualCurrentUserId])

    // Make favorites reactive with React Query
    const { data: favorites = initialFavorites } = useQuery({
        queryKey: CACHE_KEYS.market.favorites(actualCurrentUserId || ''),
        queryFn: async () => {
            if (!actualCurrentUserId) return []
            const { data } = await supabase
                .from('favorites')
                .select('listing_id')
                .eq('user_id', actualCurrentUserId)
            return data?.map((f: { listing_id: string }) => f.listing_id) || []
        },
        initialData: initialFavorites,
        enabled: !!actualCurrentUserId,
        staleTime: 1000 * 60, // 1 minute
    })

    const favoritesSet = new Set(favorites)

    // Virtualization
    const rowVirtualizer = useVirtualizer({
        count: Math.ceil(filteredListings.length / columnCount) + (hasNextPage ? 1 : 0), // Extra row for loader
        getScrollElement: () => parentRef.current,
        estimateSize: () => 320,
        overscan: 2,
    })

    // Infinite Scroll Trigger
    useEffect(() => {
        const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse()
        if (!lastItem) return

        const totalRows = Math.ceil(filteredListings.length / columnCount)

        if (
            lastItem.index >= totalRows - 1 &&
            hasNextPage &&
            !isFetchingNextPage
        ) {
            fetchNextPage()
        }
    }, [rowVirtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage, filteredListings.length, columnCount, fetchNextPage])


    // Show skeleton initially if no data
    // Show skeleton if loading and no data available yet (neither initial nor cached)
    if (isPending && listings.length === 0) return <FeedSkeleton />

    // Show empty state
    if (filteredListings.length === 0 && !isPending) {
        return (
            <PullToRefresh onRefresh={async () => { await refetch() }}>
                <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
                    <div className="text-muted-foreground">
                        No hay anuncios todavía.
                    </div>
                </div>
            </PullToRefresh>
        )
    }

    return (
        <PullToRefresh onRefresh={async () => { await refetch() }}>
            <div
                ref={parentRef}
                // FIXED: Valid height for virtualization (was min-h before, breaking virtualizer)
                className="h-[calc(100vh-120px)] bg-transparent overflow-y-auto no-scrollbar"
                style={{ height: 'calc(100vh - 120px)' }}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const isLoaderRow = virtualRow.index === Math.ceil(filteredListings.length / columnCount)

                        if (isLoaderRow) {
                            return (
                                <div
                                    key={virtualRow.key}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    className="flex items-center justify-center p-4 w-full"
                                >
                                    {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                                </div>
                            )
                        }

                        const startIndex = virtualRow.index * columnCount
                        const rowListings = filteredListings.slice(startIndex, startIndex + columnCount)

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
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-3 px-3 py-2">
                                    {rowListings.map((listing: Listing, colIndex: number) => {
                                        const index = startIndex + colIndex
                                        return (
                                            <div key={listing.id}>
                                                <ListingCard
                                                    listing={listing}
                                                    currentUserId={actualCurrentUserId}
                                                    isFavorited={favoritesSet.has(listing.id)}
                                                    priority={index < 4}
                                                    averageLikes={initialAverageLikes}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </PullToRefresh>
    )
}
