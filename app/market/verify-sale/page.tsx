'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { VerifySaleClient } from '@/components/market/verify-sale-client'

function VerifySaleContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const router = useRouter()
    const [listing, setListing] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            if (!token) {
                setError('No token provided')
                setLoading(false)
                return
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push(`/auth/login?next=/market/verify-sale?token=${token}`)
                return
            }
            setCurrentUser(user)

            try {
                const { data: listingData, error: fetchError } = await supabase
                    .from('listings')
                    .select('*, user:users!listings_user_id_fkey(*)')
                    .eq('sale_token', token)
                    .single()

                if (fetchError || !listingData) {
                    setError('Invalid token')
                } else if (listingData.user_id === user.id) {
                    setError('Own item')
                } else {
                    setListing(listingData)
                }
            } catch (err) {
                console.error('Error verifying sale:', err)
                setError('Error verifying sale')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [token, router, supabase])

    if (loading) return <div className="min-h-screen flex items-center justify-center">Verificando...</div>

    if (error === 'Invalid token' || !token) {
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

    if (error === 'Own item') {
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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/30 pb-24 md:pb-4">
            <VerifySaleClient listing={listing} token={token} />
        </div>
    )
}

export default function VerifySalePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <VerifySaleContent />
        </Suspense>
    )
}
