import { createClient } from '@/lib/supabase-server'
import { Heart } from 'lucide-react'
import { ListingCard } from '@/components/market/listing-card'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import WishlistClient from './wishlist-client'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

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

    const wishlistItems = favorites?.filter((f: any) => f.listings).map((item: any) => {
        const listing = item.listings
        return {
            ...listing,
            user: Array.isArray(listing.user) ? listing.user[0] : listing.user
        }
    }) || []

    return (
        <WishlistClient initialItems={wishlistItems} />
    )
}
