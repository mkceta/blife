'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ListingCard } from '@/components/market/listing-card'
import { MarketFilters } from '@/components/market/market-filters'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import Link from 'next/link'

import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useCallback } from 'react'

function MarketFeedContent() {
    const searchParams = useSearchParams()
    const [listings, setListings] = useState<any[]>([])
    const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const supabase = createClient()

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        let marketQuery = supabase
            .from('listings')
            .select('*, user:users!listings_user_id_fkey(alias_inst, rating_avg, degree, avatar_url)')
            .eq('is_hidden', false)
            .neq('status', 'sold')

        const q = searchParams.get('q')
        const category = searchParams.get('category')
        const degree = searchParams.get('degree')
        const minPrice = searchParams.get('min_price')
        const maxPrice = searchParams.get('max_price')
        const sort = searchParams.get('sort') || 'newest'

        if (q) {
            marketQuery = marketQuery.ilike('title', `%${q}%`)
        }
        if (category) {
            marketQuery = marketQuery.eq('category', category)
        }
        if (degree) {
            marketQuery = marketQuery.eq('user.degree', degree)
        }
        if (minPrice) {
            marketQuery = marketQuery.gte('price_cents', parseFloat(minPrice) * 100)
        }
        if (maxPrice) {
            marketQuery = marketQuery.lte('price_cents', parseFloat(maxPrice) * 100)
        }

        switch (sort) {
            case 'oldest':
                marketQuery = marketQuery.order('created_at', { ascending: true })
                break
            case 'price_asc':
                marketQuery = marketQuery.order('price_cents', { ascending: true })
                break
            case 'price_desc':
                marketQuery = marketQuery.order('price_cents', { ascending: false })
                break
            default:
                // Default 'Discovery' Algorithm:
                // Fetch latest 50 items and shuffle them client-side to ensure freshness
                // and "distinct feeds each time".
                marketQuery = marketQuery.order('created_at', { ascending: false }).limit(50)
        }

        const { data: listingsData } = await marketQuery

        if (listingsData) {
            let finalListings = listingsData

            // If default sort, shuffle the results for 'Discovery' feel
            if (sort === 'newest') { // 'newest' is the default if param is missing? No, param is missing.
                // Actually the default in switch is for missing sort.
                // Let's check searchParams again.
            }

            // If we are in the default "Discovery" mode (no explicit sort or 'recommended')
            // We shuffle. 
            // Note: The switch case 'default' handles the query.
            // But we need to know if we should shuffle.
            const isDiscovery = !sort || sort === 'recommended'

            if (isDiscovery) {
                // Fisher-Yates Shuffle
                for (let i = finalListings.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [finalListings[i], finalListings[j]] = [finalListings[j], finalListings[i]];
                }
            }

            setListings(finalListings)

            if (user) {
                const { data: favorites } = await supabase
                    .from('favorites')
                    .select('listing_id')
                    .eq('user_id', user.id)
                    .in('listing_id', listingsData.map(l => l.id))

                if (favorites) {
                    setUserFavorites(new Set(favorites.map((f: any) => f.listing_id)))
                }
            }
        }
        setLoading(false)
    }, [searchParams, supabase])

    useEffect(() => {
        setLoading(true)
        fetchData()
    }, [fetchData])

    const handleRefresh = async () => {
        await fetchData()
    }

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="min-h-[calc(100vh-10rem)] bg-background">
                {loading ? (
                    <div className="text-center py-20 text-muted-foreground">Cargando anuncios...</div>
                ) : (
                    // Vinted style grid: tighter gaps, 2 cols on mobile, 5 on desktop
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-6 gap-x-4 px-3 pb-24 pt-4 auto-rows-max">
                        {listings.map((listing, index) => (
                            <div key={listing.id} className={index < 4 ? "" : "stagger-item"}>
                                <ListingCard
                                    listing={listing}
                                    currentUserId={currentUser?.id}
                                    isFavorited={userFavorites.has(listing.id)}
                                    priority={index < 4}
                                />
                            </div>
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
        <div className="md:hidden sticky top-0 z-40 w-full bg-background border-b border-border/5 shadow-sm pt-safe">
            <div className="flex flex-col gap-2 px-3 pt-2 pb-0">
                <div className="flex gap-2 items-center">
                    <form action="/home" method="GET" className="flex-1 relative">
                        <input type="hidden" name="tab" value="market" />
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                name="q"
                                defaultValue={searchParams.get('q') || ''}
                                placeholder="Busca artículos o miembros"
                                className="h-11 w-full bg-muted/30 pl-10 pr-10 border-none focus-visible:ring-0 rounded-lg text-base"
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
                                href={cat.id ? `/home?tab=market&category=${cat.id}` : '/home?tab=market'}
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
    )
}

export function MarketFeed() {
    return (
        <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Cargando...</div>}>
            <MarketFeedContent />
        </Suspense>
    )
}
