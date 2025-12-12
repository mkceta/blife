'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
    initialFavorites?: string[] // IDs
    initialAverageLikes?: number
    currentUserId?: string
}

function MarketFeedContent({
    initialListings = [],
    initialFavorites = [],
    initialAverageLikes = 0,
    currentUserId
}: MarketFeedProps) {
    const searchParams = useSearchParams()

    // We used to have state here, but it caused hydration loops and isn't strictly necessary
    // now that the server handles shuffling and data fetching.
    // We can directly use the props.

    // We do need to allow "Pull to Refresh" to work, but standard window.reload()
    // works fine for that as it re-runs server data fetching.

    // We only need supabase client if we do client-side operations later
    const supabase = createClient()

    const favoritesSet = new Set(initialFavorites)

    const handleRefresh = async () => {
        window.location.reload()
    }

    // Check loading state?
    // If we are relying on Props, we are only "loading" if initialListings is empty AND we expect data.
    // But initialListings usually comes defined from server (empty array if no results).
    // So "loading" state is handled by Suspense boundary in parent usually.
    // However, if we wanted to show a skeleton inside the PullToRefresh while reloading...
    // window.reload() will show the browser spinner or the Suspense fallback of the page.

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="min-h-[calc(100vh-10rem)] bg-transparent">
                {/* Vinted style grid: tighter gaps, 2 cols on mobile, 5 on desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-6 gap-x-4 px-3 pb-24 pt-4 auto-rows-max">
                    {initialListings.map((listing, index) => (
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

                {(!initialListings || initialListings.length === 0) && (
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
    const router = useRouter()
    const currentCategory = searchParams.get('category')
    const [inputValue, setInputValue] = useState(searchParams.get('q') || '')
    const timeoutRef = useRef<NodeJS.Timeout>(null)

    // Sync inputValue with URL query when navigation occurs (e.g., back/forward)
    useEffect(() => {
        setInputValue(searchParams.get('q') || '')
    }, [searchParams])

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    const handleSearch = (value: string) => {
        setInputValue(value);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set('q', value);
            } else {
                params.delete('q');
            }
            router.replace(`/home/market?${params.toString()}`);
        }, 300);
    };

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
                        <div className="flex-1 relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={inputValue}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Busca artículos o miembros"
                                    className="pl-9 h-9 bg-muted/50 border-border/50 focus-visible:ring-1 rounded-full text-sm"
                                />
                            </div>
                        </div>
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

export function MarketFeed(props: MarketFeedProps) {
    return (
        <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Cargando...</div>}>
            <MarketFeedContent {...props} />
        </Suspense>
    )
}
