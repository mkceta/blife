'use client';

import { createClient } from '@/lib/supabase';
import { FlatCard } from '@/components/flats/flat-card';
import { FlatsSkeleton } from '@/components/home/flats-skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

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
    // If we want "Instant" feel, we rely on initialFlats and only refetch if filters change significantly 
    // or if we want to ensure freshness.
    const { data: flats, isLoading, refetch } = useQuery({
        queryKey: ['flats', filters],
        queryFn: async () => {
            // We can duplicate the fetch logic here for client-side cleanliness 
            // OR call an API route. Since we are client-side, we use Supabase client directly.
            let query = supabase
                .from('flats')
                .select('*, user:users!flats_user_id_fkey(alias_inst, avatar_url)')
                .eq('is_hidden', false)
                .eq('status', 'active');

            if (filters.q) query = query.ilike('title', `%${filters.q}%`);
            if (filters.min_rent) query = query.gte('rent_cents', parseFloat(filters.min_rent) * 100);
            if (filters.max_rent) query = query.lte('rent_cents', parseFloat(filters.max_rent) * 100);
            if (filters.min_rooms) query = query.gte('rooms', parseInt(filters.min_rooms));
            if (filters.min_baths) query = query.gte('baths', parseInt(filters.min_baths));
            if (filters.min_area) query = query.gte('area_m2', parseFloat(filters.min_area));
            if (filters.max_area) query = query.lte('area_m2', parseFloat(filters.max_area));
            if (filters.location_area) query = query.eq('location_area', filters.location_area);

            switch (filters.sort) {
                case 'oldest':
                    query = query.order('created_at', { ascending: true });
                    break;
                case 'price_asc':
                    query = query.order('rent_cents', { ascending: true });
                    break;
                case 'price_desc':
                    query = query.order('rent_cents', { ascending: false });
                    break;
                default:
                    // Discovery/Newest
                    query = query.order('created_at', { ascending: false }).limit(50);
            }

            const { data } = await query;
            return data || [];
        },
        initialData: initialFlats,
        staleTime: 1000 * 60 * 2, // 2 mins
    });

    // Client-side shuffle for random/discovery if needed (optional)
    const finalFlats = useMemo(() => {
        if (!flats) return [];
        let result = [...flats];
        if (!filters.sort || filters.sort === 'recommended') {
            // Simple shuffle
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
        }
        return result;
    }, [flats, filters.sort]);

    if (isLoading) return <FlatsSkeleton />;

    return (
        <PullToRefresh onRefresh={async () => { await refetch() }}>
            <div className="min-h-[calc(100vh-10rem)] bg-transparent">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-24 pt-4">
                    <AnimatePresence>
                        {finalFlats.map((flat, index) => (
                            <motion.div
                                key={flat.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
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
