import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { getListingById } from '@/lib/services/market.service'
import { ListingView } from './listing-view'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Product Detail Page - Server Component
 * 
 * Uses Edge Cached Service Layer for instant load times
 * Listing details are fetched on the server and cached
 */
export default async function ListingDetailPage({ searchParams }: PageProps) {
    const params = await searchParams
    const id = params.id as string

    if (!id) {
        notFound()
    }

    // Parallel fetch: Listing (Cached) + Current User (Auth)
    // We check cookie first to avoid auth call for anon users (perf optimization)

    // Check for auth cookie BEFORE creating supabase client
    const cookieStore = await cookies()
    const hasAuthCookie = cookieStore.getAll().some(c => c.name.includes('auth'))

    let currentUserId: string | undefined

    // Only check auth if cookie exists
    if (hasAuthCookie) {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        currentUserId = user?.id
    }

    // Fetch listing with Edge Cache
    let listing = null
    try {
        listing = await getListingById(id)
    } catch (error) {
        console.error('Error fetching listing details:', error)
    }

    if (!listing) {
        notFound()
    }

    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <ListingView
                listing={listing}
                currentUserId={currentUserId}
            />
        </Suspense>
    )
}
