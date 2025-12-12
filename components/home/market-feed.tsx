'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ListingCard } from '@/components/market/listing-card'
import { MarketFilters } from '@/components/market/market-filters'
import { FeedSkeleton } from '@/components/home/feed-skeleton'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import Link from 'next/link'

import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useCallback } from 'react'
import { motion } from 'framer-motion'

// ... imports

interface MarketFeedProps {
    initialListings?: any[]
}

function MarketFeedContent({ initialListings = [] }: MarketFeedProps) {
    const searchParams = useSearchParams()
    // listings state is initialized with props. 
    // If props change (new search), we rely on the component re-rendering with new props?
    // Actually, distinct Feed components are often key-ed by params in parent to force remount, 
    // OR we use useEffect to update state when props change.
    // BUT, if we are using Server Actions/Components fully, we might not need 'listings' state at all, just render props.
    // HOWEVER, we have 'shuffling' logic on client for 'discovery'.
    // And 'Favorites' logic.

    // Let's stick to state to allow client-side shuffling if needed, but initialize from props.
    const [listings, setListings] = useState<any[]>(initialListings)
    const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false) // Initial data is present!
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [averageLikes, setAverageLikes] = useState(0)
    const supabase = createClient()

    // Update listings when initialListings prop changes (e.g. navigation)
    useEffect(() => {
        let finalListings = [...initialListings]
        const sort = searchParams.get('sort')
        const isDiscovery = !sort || sort === 'recommended'

        if (isDiscovery) {
            // Shuffle logic here if desired, but maybe server should handle it or just do it once on mount.
            // If we shuffle on every navigation it might be jarring if data didn't change.
            // But valid for "Discovery".
            for (let i = finalListings.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [finalListings[i], finalListings[j]] = [finalListings[j], finalListings[i]];
            }
        }
        setListings(finalListings)
    }, [initialListings, searchParams])


    const fetchFavorites = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        const { data: avg } = await supabase.rpc('get_average_listing_favorites')
        if (avg) setAverageLikes(avg)

        if (user && initialListings.length > 0) {
            const { data: favorites } = await supabase
                .from('favorites')
                .select('listing_id')
                .eq('user_id', user.id)
                .in('listing_id', initialListings.map(l => l.id))

            if (favorites) {
                setUserFavorites(new Set(favorites.map((f: any) => f.listing_id)))
            }
        }
    }, [supabase, initialListings])


    // Just fetch favorites on mount or when listings change
    useEffect(() => {
        fetchFavorites()
    }, [fetchFavorites])

    const handleRefresh = async () => {
        // Refresh could trigger a router refresh to re-run server fetch
        // or standard client fetch. 
        // Simpler: location.reload() or router.refresh()
        // router.refresh() re-executes server components.
        // But we need to wait for it.
        // For now, let's keep it simple: router.refresh() 
        // to get fresh data from server (which might be cached 60s, so actually we might need to invalidate?)
        // If we want *real* refresh we might need to bust cache.
        // For now, standard refresh.
        window.location.reload()
    }

    // ... render use listings ...



    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="min-h-[calc(100vh-10rem)] bg-transparent">
                {loading ? (
                    <div className="px-4 py-6">
                        <FeedSkeleton />
                    </div>
                ) : (
                    // Vinted style grid: tighter gaps, 2 cols on mobile, 5 on desktop
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-6 gap-x-4 px-3 pb-24 pt-4 auto-rows-max">
                        {listings.map((listing, index) => (
                            <motion.div
                                key={listing.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }} // Cap delay
                            >
                                <ListingCard
                                    listing={listing}
                                    currentUserId={currentUser?.id}
                                    isFavorited={userFavorites.has(listing.id)}
                                    priority={index < 4}
                                    averageLikes={averageLikes}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}

                {!loading && (!listings || listings.length === 0) && (
                    <div className="text-center py-20 text-muted-foreground">
                        No hay anuncios todavía.
                    </div>
                )}
            </div>
        </PullToRefresh>
    )
}

export function MarketSearchBar() {
    const searchParams = useSearchParams()
    const currentCategory = searchParams.get('category')

    const categories = [
        { id: null, label: 'Todo' },
        { id: 'Electronica', label: 'Electrónica' },
        { id: 'LibrosApuntes', label: 'Libros' },
        { id: 'Material', label: 'Material' },
        { id: 'Ropa', label: 'Ropa' },
        { id: 'Muebles', label: 'Muebles' },
        { id: 'Transporte', label: 'Transporte' },
        { id: 'Servicios', label: 'Servicios' },
        { id: 'Ocio', label: 'Ocio' },
        { id: 'Otros', label: 'Otros' },
    ]

    return (
        <div className="md:hidden relative z-40">
            {/* Sticky at top offset by HomeNav height (12 = 3rem) + safe area. 
                HomeNav has pt-safe. Its height is 3rem + env(safe-area-inset-top).
                So we stick at that offset. 
                However, calc(3rem + env(...)) in 'top' might be tricky if not supported everywhere, but broadly ok. 
                Actually, HomeNav is sticky top-0. It occupies the top space.
                If we use sticky, we define "top" as the distance from viewport top where it sticks.
                We want it to stick adjacent to HomeNav bottom.
            */}
            <div
                className="sticky w-full bg-background/95 backdrop-blur-md border-b border-border/5 shadow-sm pt-2"
                style={{ top: 'calc(3rem + env(safe-area-inset-top))' }}
            >
                <div className="flex flex-col gap-2 px-3 pb-0">
                    <div className="flex gap-2 items-center">
                        <form action="/home/market" method="GET" className="flex-1 relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    name="q"
                                    defaultValue={searchParams.get('q') || ''}
                                    placeholder="Busca artículos o miembros"
                                    className="pl-9 h-9 bg-muted/50 border-border/50 focus-visible:ring-1 rounded-full text-sm"
                                />
                            </div>
                        </form>
                        <div className="flex-none">
                            <MarketFilters />
                        </div>
                    </div>
                    {/* Category Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-3 -mx-3 px-3 scrollbar-hide">
                        {categories.map((cat) => {
                            const isActive = currentCategory === cat.id || (cat.id === null && !currentCategory)
                            return (
                                <Link
                                    key={cat.label}
                                    href={isActive
                                        ? '/home/market'
                                        : (cat.id ? `/home/market?category=${cat.id}` : '/home/market')
                                    }
                                    className={`
                                        whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
                                        ${isActive
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'
                                        }
                                    `}
                                >
                                    {cat.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function MarketFeed({ initialListings }: { initialListings?: any[] }) {
    return (
        <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Cargando...</div>}>
            <MarketFeedContent initialListings={initialListings} />
        </Suspense>
    )
}
