'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ListingForm } from '@/features/market/components/listing-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

function EditListingContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const router = useRouter()
    const [listing, setListing] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            if (!id) return

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            const { data: listingData, error } = await supabase
                .from('listings')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !listingData) {
                console.error('Error fetching listing:', error)
                // Handle 404
                return
            }

            // Verify ownership
            if (listingData.user_id !== user.id) {
                router.push('/market')
                return
            }

            setListing(listingData)
            setLoading(false)
        }

        fetchData()
    }, [id, router, supabase])

    if (!id) return <div>No ID provided</div>
    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    if (!listing) return <div className="min-h-screen flex items-center justify-center">Listing not found</div>

    return (
        <div className="container max-w-md mx-auto p-4">
            <div className="flex items-center gap-2 mb-6">
                <Button asChild variant="ghost" size="icon">
                    <Link href={`/market/product?id=${listing.id}`}>
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold">Editar Anuncio</h1>
            </div>

            <ListingForm initialData={listing} listingId={listing.id} />
        </div>
    )
}

export default function EditListingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <EditListingContent />
        </Suspense>
    )
}
