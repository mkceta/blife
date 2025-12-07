'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Heart } from 'lucide-react'
import { ListingCard } from '@/components/market/listing-card'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'

export default function WishlistPage() {
    const [wishlistItems, setWishlistItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login')
            return
        }

        const { data: favorites } = await supabase
            .from('favorites')
            .select(`
                listing_id,
                created_at,
                listings:listings (
                    id,
                    title,
                    price_cents,
                    photos,
                    status,
                    created_at,
                    user_id,
                    user:users!listings_user_id_fkey(alias_inst, rating_avg, degree, avatar_url),
                    favorites_count
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        const items = favorites?.filter(f => f.listings) || []
        setWishlistItems(items)
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [router, supabase])

    if (loading) return <div className="h-full flex items-center justify-center">Cargando favoritos...</div>

    return (
        <div className="flex flex-col h-full bg-background min-h-screen pb-20 md:pb-0">
            {/* Header matching Messages/Notifications style */}
            <div className="flex flex-col border-b border-border/50 bg-background pt-[calc(env(safe-area-inset-top)+1rem)] sticky top-0 z-30">
                <div className="px-4 pb-4">
                    <h2 className="text-xl font-bold">Favoritos ({wishlistItems.length})</h2>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <PullToRefresh onRefresh={fetchData}>
                    <div className="h-full overflow-y-auto p-4 scrollbar-thin">
                        {wishlistItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Heart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                <p className="text-lg mb-2">Tu lista de favoritos está vacía</p>
                                <p className="text-sm">Guarda lo que te guste para verlo aquí</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {wishlistItems.map((item: any) => {
                                        const listing = item.listings
                                        const formattedListing = {
                                            ...listing,
                                            user: Array.isArray(listing.user) ? listing.user[0] : listing.user
                                        }

                                        return (
                                            <ListingCard
                                                key={listing.id}
                                                listing={formattedListing}
                                                isFavorited={true}
                                            />
                                        )
                                    })}
                                </div>
                                <div className="h-24 md:h-0" /> {/* Spacer */}
                            </>
                        )}
                    </div>
                </PullToRefresh>
            </div>
        </div>
    )
}
