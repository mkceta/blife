'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Heart } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { ListingCard } from '@/components/market/listing-card'

export default function WishlistPage() {
    const [wishlistItems, setWishlistItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
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

        fetchData()
    }, [router, supabase])

    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando wishlist...</div>

    return (
        <div className="bg-gradient-to-b from-primary/10 via-primary/5 to-background min-h-screen pb-20">
            <PageHeader title="Wishlist" icon={<Heart className="h-5 w-5 text-primary" />} />

            <div className="p-4">
                {wishlistItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Heart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg mb-2">Tu wishlist está vacía</p>
                        <p className="text-sm">Añade productos que te gusten para verlos aquí</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {wishlistItems.map((item: any) => {
                            const listing = item.listings
                            // Asegurar que el formato sea consistente con el mercado
                            const formattedListing = {
                                ...listing,
                                user: Array.isArray(listing.user) ? listing.user[0] : listing.user
                            }

                            return (
                                <ListingCard
                                    key={listing.id}
                                    listing={formattedListing}
                                    currentUserId={undefined} // We can get current user if needed, but for card display it might be optional or handled inside
                                    isFavorited={true}
                                />
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
