import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { WishlistContent } from './wishlist-content'

/**
 * Wishlist Page - Server Component
 * 
 * Fetches user's favorited listings server-side
 */
export default async function WishlistPage() {
    let wishlistItems: any[] = []

    try {
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            redirect('/auth/login?redirectTo=/wishlist')
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

        wishlistItems = favorites?.filter(f => f.listings).map(item => {
            const transformListing = (l: any) => ({
                ...l,
                photos: Array.isArray(l.photos) ? l.photos.map((p: any) => typeof p === 'string' ? { url: p } : p) : []
            })

            const listings = Array.isArray(item.listings)
                ? item.listings.map(transformListing)
                : item.listings ? transformListing(item.listings) : null

            return { ...item, listings }
        }) || []
    } catch (error) {
        console.error('WishlistPage error:', error)
        redirect('/auth/login?redirectTo=/wishlist')
    }

    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <WishlistContent initialWishlistItems={wishlistItems} />
        </Suspense>
    )
}
