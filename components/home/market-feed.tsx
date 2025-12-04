'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ListingCard } from '@/components/market/listing-card'
import { MarketFilters } from '@/components/market/market-filters'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

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
                marketQuery = marketQuery.order('created_at', { ascending: false })
        }

        const { data: listingsData } = await marketQuery

        if (listingsData) {
            setListings(listingsData)

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
            <div className="min-h-[calc(100vh-10rem)]">
                {loading ? (
                    <div className="text-center py-20 text-muted-foreground">Cargando anuncios...</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
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

    return (
        <div className="sticky top-[calc(5.5rem+env(safe-area-inset-top))] z-50 flex justify-center pointer-events-none px-4">
            <div className="w-full max-w-2xl pointer-events-auto pb-6">
                <form action="/home" method="GET" className="glass-strong rounded-2xl border border-white/10 p-3 shadow-lg">
                    <input type="hidden" name="tab" value="market" />
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <Input
                                name="q"
                                defaultValue={searchParams.get('q') || ''}
                                placeholder="Buscar productos..."
                                className="pl-10 border-white/10 bg-background/70 focus-visible:ring-primary/20"
                            />
                        </div>
                        <MarketFilters />
                    </div>
                </form>
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
