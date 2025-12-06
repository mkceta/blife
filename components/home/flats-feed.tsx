'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { FlatCard } from '@/components/flats/flat-card'
import { FlatFilters } from '@/components/flats/flat-filters'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useCallback } from 'react'

function FlatsFeedContent() {
    const searchParams = useSearchParams()
    const [flats, setFlats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const supabase = createClient()

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        let flatsQuery = supabase
            .from('flats')
            .select('*, user:users!flats_user_id_fkey(alias_inst, avatar_url)')
            .eq('is_hidden', false)
            .eq('status', 'active')

        const q = searchParams.get('q')
        const minRent = searchParams.get('min_rent')
        const maxRent = searchParams.get('max_rent')
        const minRooms = searchParams.get('min_rooms')
        const minBaths = searchParams.get('min_baths')
        const minArea = searchParams.get('min_area')
        const maxArea = searchParams.get('max_area')
        const locationArea = searchParams.get('location_area')
        const sort = searchParams.get('sort') || 'newest'

        if (q) {
            flatsQuery = flatsQuery.ilike('title', `%${q}%`)
        }
        if (minRent) {
            flatsQuery = flatsQuery.gte('rent_cents', parseFloat(minRent) * 100)
        }
        if (maxRent) {
            flatsQuery = flatsQuery.lte('rent_cents', parseFloat(maxRent) * 100)
        }
        if (minRooms) {
            flatsQuery = flatsQuery.gte('rooms', parseInt(minRooms))
        }
        if (minBaths) {
            flatsQuery = flatsQuery.gte('baths', parseInt(minBaths))
        }
        if (minArea) {
            flatsQuery = flatsQuery.gte('area_m2', parseFloat(minArea))
        }
        if (maxArea) {
            flatsQuery = flatsQuery.lte('area_m2', parseFloat(maxArea))
        }
        if (locationArea) {
            flatsQuery = flatsQuery.eq('location_area', locationArea)
        }

        switch (sort) {
            case 'oldest':
                flatsQuery = flatsQuery.order('created_at', { ascending: true })
                break
            case 'price_asc':
                flatsQuery = flatsQuery.order('rent_cents', { ascending: true })
                break
            case 'price_desc':
                flatsQuery = flatsQuery.order('rent_cents', { ascending: false })
                break
            default:
                // "Discovery" shuffle for default view
                flatsQuery = flatsQuery.order('created_at', { ascending: false }).limit(50)
        }

        const { data: flatsData } = await flatsQuery

        if (flatsData) {
            let finalFlats = flatsData
            // Shuffle if default sort (Discovery mode)
            const isDiscovery = !sort || sort === 'recommended'

            if (isDiscovery) {
                for (let i = finalFlats.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [finalFlats[i], finalFlats[j]] = [finalFlats[j], finalFlats[i]];
                }
            }
            setFlats(finalFlats)
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
                    <div className="text-center py-20 text-muted-foreground">Cargando pisos...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-24 pt-4">
                        {flats.map((flat, index) => (
                            <div key={flat.id} className={index < 4 ? "" : "stagger-item"}>
                                <FlatCard
                                    flat={flat}
                                    currentUserId={currentUser?.id}
                                    priority={index < 4}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && (!flats || flats.length === 0) && (
                    <div className="text-center py-20 text-muted-foreground">
                        No hay pisos disponibles todavía.
                    </div>
                )}
            </div>
        </PullToRefresh>
    )
}

export function FlatsSearchBar({ flats }: { flats: any[] }) {
    const searchParams = useSearchParams()

    return (
        <div className="md:hidden sticky top-0 z-40 w-full bg-background border-b border-border/5 shadow-sm">
            <div className="flex flex-col gap-2 px-3 pb-2 pt-2">
                <div className="flex gap-2 items-center">
                    <form action="/home" method="GET" className="flex-1 relative">
                        <input type="hidden" name="tab" value="flats" />
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                name="q"
                                defaultValue={searchParams.get('q') || ''}
                                placeholder="Buscar pisos..."
                                className="h-11 w-full bg-muted/30 pl-10 pr-10 border-none focus-visible:ring-0 rounded-lg text-base"
                            />
                        </div>
                    </form>
                    <div className="flex-none">
                        <FlatFilters flats={flats || []} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function FlatsFeed() {
    return (
        <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Cargando...</div>}>
            <FlatsFeedContent />
        </Suspense>
    )
}
