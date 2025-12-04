'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ListingCard } from '@/components/market/listing-card'
import { MarketFilters } from '@/components/market/market-filters'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

function MarketFeedContent() {
    const searchParams = useSearchParams()
    const [listings, setListings] = useState<any[]>([])
    const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
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
        }

        fetchData()
    }, [searchParams, supabase])

    return (
        <div className="space-y-6">
            <form action="/home" method="GET" className="sticky top-[calc(4.5rem+env(safe-area-inset-top))] z-20 mx-auto max-w-2xl w-full mb-6 px-4 md:px-0 pt-2 bg-background/95 backdrop-blur-sm pb-2 rounded-b-xl shadow-sm">
                <input type="hidden" name="tab" value="market" />
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-2">
                        <Input
                            name="q"
                            defaultValue={searchParams.get('q') || ''}
                            placeholder="Buscar productos..."
                            className="pl-9 bg-card/50 border-white/10"
                        />
                        <MarketFilters />
                    </div>
                </div>
            </form>

            {loading ? (
                <div className="text-center py-20 text-muted-foreground">Cargando anuncios...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
    )
}

export function MarketFeed() {
    return (
        <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Cargando...</div>}>
            <MarketFeedContent />
        </Suspense>
    )
}
