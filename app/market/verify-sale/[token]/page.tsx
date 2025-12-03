import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getListingByToken } from '@/app/market/sale-actions'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { VerifySaleClient } from '@/components/market/verify-sale-client'

interface VerifySalePageProps {
    params: Promise<{
        token: string
    }>
}

export default async function VerifySalePage(props: VerifySalePageProps) {
    const params = await props.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/auth/login?next=/market/verify-sale/${params.token}`)
    }

    const listing = await getListingByToken(params.token)

    if (!listing) {
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

    // Don't allow buying your own item
    if (listing.user_id === user.id) {
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
            <VerifySaleClient listing={listing} token={params.token} />
        </div>
    )
}
