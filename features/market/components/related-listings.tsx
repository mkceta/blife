'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ListingCard } from '@/features/market/components/listing-card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import type { Listing } from '@/lib/types'

interface RelatedListingsProps {
    currentListingId: string
    category: string
    currentUserId?: string
}

export function RelatedListings({ currentListingId, category, currentUserId }: RelatedListingsProps) {
    const [listings, setListings] = useState<Listing[]>([])
    const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchRelated() {
            const { data: listingsData } = await supabase
                .from('listings')
                .select('*, user:users!listings_user_id_fkey(alias_inst, rating_avg, degree, avatar_url)')
                .eq('category', category)
                .eq('is_hidden', false)
                .neq('status', 'sold')
                .neq('id', currentListingId)
                .limit(6)

            if (listingsData && listingsData.length > 0) {
                setListings(listingsData)

                if (currentUserId) {
                    const { data: favorites } = await supabase
                        .from('favorites')
                        .select('listing_id')
                        .eq('user_id', currentUserId)
                        .in('listing_id', listingsData.map((l: { id: string }) => l.id))

                    if (favorites) {
                        setUserFavorites(new Set(favorites.map((f: { listing_id: string }) => f.listing_id)))
                    }
                }
            }
            setLoading(false)
        }

        fetchRelated()
    }, [category, currentListingId, currentUserId, supabase])

    if (loading) return <div className="py-8 text-center text-muted-foreground">Cargando relacionados...</div>
    if (!listings || listings.length === 0) return null

    return (
        <div className="space-y-4 pt-8">
            <h3 className="text-xl font-bold px-5 md:px-0">Productos Relacionados</h3>
            <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex w-max space-x-4 px-5 md:px-0">
                    {listings.map((listing) => (
                        <div key={listing.id} className="w-[250px] whitespace-normal">
                            <ListingCard
                                listing={listing}
                                currentUserId={currentUserId}
                                isFavorited={userFavorites.has(listing.id)}
                            />
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
        </div>
    )
}
