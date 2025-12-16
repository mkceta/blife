import { MarketSearchBar } from '@/features/home/components/market-search-bar'
import ProductFeedLayout from '@/app/product-feed-layout'
import { MarketFeedContent } from './market-feed-content'
import { getMarketListingsCached, getUserFavorites, getAverageLikes, MarketFilters } from '@/lib/services/market.service'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * Market Page - Server Component with SSR
 * 
 * Fetches initial data server-side for instant page load:
 * - Market listings (cached, 60s revalidation)
 * - User favorites (if authenticated)
 * - Average likes for recommendation algorithm
 * 
 * Client component receives this data as initialData for React Query,
 * enabling instant render + background revalidation
 */
export default async function MarketPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams

    // Build filters from search params
    const filters: MarketFilters = {
        q: params.q as string,
        category: params.category as string,
        sort: params.sort as MarketFilters['sort'],
        degree: params.degree as string,
        size: params.size as string,
        minPrice: params.min_price ? parseFloat(params.min_price as string) : undefined,
        maxPrice: params.max_price ? parseFloat(params.max_price as string) : undefined,
    }

    // Check for auth cookie BEFORE creating supabase client
    // This saves ~100ms if user is not logged in
    const cookieStore = await cookies()
    const hasAuthCookie = cookieStore.getAll().some(c => c.name.includes('auth'))

    let userId: string | undefined
    let favorites: string[] = []

    // Only check auth if cookie exists
    if (hasAuthCookie) {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id
        if (userId) {
            favorites = await getUserFavorites(userId)
        }
    }

    // Fetch public data in parallel (always) with error handling
    let listings: any[] = []
    let averageLikes = 0

    try {
        const [fetchedListings, fetchedLikes] = await Promise.all([
            getMarketListingsCached(filters),
            getAverageLikes(),
        ])
        listings = fetchedListings
        averageLikes = fetchedLikes
    } catch (error) {
        console.error('Error in MarketPage data fetch:', error)
        // Fallback to empty states to prevent page crash
    }

    return (
        <ProductFeedLayout>
            <div className="min-h-[50vh] outline-none">
                <MarketSearchBar />
                <MarketFeedContent
                    initialListings={listings}
                    initialFavorites={favorites}
                    initialAverageLikes={averageLikes}
                    currentUserId={userId}
                    initialFilters={filters}
                />
            </div>
        </ProductFeedLayout>
    )
}

