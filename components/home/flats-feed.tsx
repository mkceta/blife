'use client';

import { createClient } from '@/lib/supabase';
import { FlatCard } from '@/components/flats/flat-card';
import { FlatsSkeleton } from '@/components/home/flats-skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { fetchFlatsAction } from '@/app/feed-actions'
import { FlatsFilters } from '@/lib/flats-data'

interface FlatsFeedProps {
    initialFlats: any[];
    currentUserId?: string;
}

export function FlatsFeed({ initialFlats, currentUserId }: FlatsFeedProps) {
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Map URL params to filters object for easier handling
    const filters = useMemo(() => ({
        q: searchParams.get('q') || '',
        min_rent: searchParams.get('min_rent'),
        max_rent: searchParams.get('max_rent'),
        min_rooms: searchParams.get('min_rooms'),
        min_baths: searchParams.get('min_baths'),
        min_area: searchParams.get('min_area'),
        max_area: searchParams.get('max_area'),
        location_area: searchParams.get('location_area'),
        sort: searchParams.get('sort') || 'newest'
    }), [searchParams]);

    // Use React Query for data fetching/caching
    const { data: flats, refetch, isPending } = useQuery({
        queryKey: ['flats', filters],
        queryFn: async () => {
            // Cast filters to FlatsFilters as they are mostly compatible strings/undefined
            const actionFilters: FlatsFilters = {
                q: filters.q,
                min_rent: filters.min_rent || undefined,
                max_rent: filters.max_rent || undefined,
                min_rooms: filters.min_rooms || undefined,
                min_baths: filters.min_baths || undefined,
                min_area: filters.min_area || undefined,
                max_area: filters.max_area || undefined,
                location_area: filters.location_area || undefined,
                sort: filters.sort === 'recommended' ? undefined : filters.sort
            }
            const data = await fetchFlatsAction(actionFilters as any)
            return data || []
        },
        initialData: initialFlats.length > 0 ? initialFlats : undefined,
        initialDataUpdatedAt: initialFlats.length > 0 ? Date.now() : undefined,
        staleTime: 1000 * 60 * 5, // 5 mins
        placeholderData: (previousData) => previousData, // Keep old data while refetching
    });

    // Only show skeleton on first load
    if (isPending) {
        return <FlatsSkeleton />
    }

    // Client-side shuffle for random/discovery if needed (optional)
    const finalFlats = useMemo(() => {
        if (!flats) return [];
        let result = [...flats];
        if (!filters.sort || filters.sort === 'recommended') {
            // Simple shuffle
            // Sort happens on server too, but if we want random stability?
            // Actually shuffling on every render is bad.
            // We'll trust the server order or just use index.
            // Let's keep it simple.
        }
        return result;
    }, [flats, filters.sort]);

    return (
        <PullToRefresh onRefresh={async () => { await refetch() }}>
            <div className="min-h-[calc(100vh-10rem)] bg-transparent">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 px-4 pb-24 pt-4">
                    <AnimatePresence>
                        {finalFlats.map((flat, index) => (
                            <motion.div
                                key={flat.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{
                                    duration: 0.3,
                                    delay: Math.min(index * 0.01, 0.1)
                                }}
                            >
                                <FlatCard
                                    flat={flat}
                                    currentUserId={currentUserId}
                                    priority={index < 4}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {finalFlats.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        No hay pisos disponibles con estos filtros.
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
}
