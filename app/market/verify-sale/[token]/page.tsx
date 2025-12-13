'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { getListingByToken } from '@/app/market/sale-actions'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { VerifySaleClient } from '@/components/market/verify-sale-client'

export default function VerifySalePage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string
    const [user, setUser] = useState<any>(null)
    const [listing, setListing] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        async function loadData() {
            setLoading(true)

            // Get current user
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (!authUser) {
                router.push(`/auth/login?next=/market/verify-sale/${token}`)
                return
            }

            setUser(authUser)

            // Get listing by token
            try {
                const listingData = await getListingByToken(token)

                if (!listingData) {
                    setError('invalid')
                    setLoading(false)
                    return
                }

                // Don't allow buying your own item
                if (listingData.user_id === authUser.id) {
                    setError('own_item')
                    setLoading(false)
                    return
                }

                setListing(listingData)
            } catch (err) {
                console.error('Error loading listing:', err)
                setError('invalid')
            }

            setLoading(false)
        }

        loadData()
    }, [token, router, supabase])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Verificando código de venta...</p>
            </div>
        )
    }

    if (error === 'invalid') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
                <div className="bg-red-100 p-4 rounded-full">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold">Código Inválido o Expirado</h1>
                <p className="text-muted-foreground">Este código de venta no es válido o el producto ya ha sido vendido.</p>
                <Link href="/market">
                    <Button>Volver al Mercado</Button>
                </Link>
            </div>
        )
    }

    if (error === 'own_item') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
                <div className="bg-yellow-100 p-4 rounded-full">
                    <AlertCircle className="h-12 w-12 text-yellow-500" />
                </div>
                <h1 className="text-2xl font-bold">No puedes comprar tu propio artículo</h1>
                <Link href="/market">
                    <Button>Volver al Mercado</Button>
                </Link>
            </div>
        )
    }

    if (!listing) {
        return null
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/30 pb-24 md:pb-4">
            <VerifySaleClient listing={listing} token={token} />
        </div>
    )
}
