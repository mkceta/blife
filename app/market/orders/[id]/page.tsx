
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2, Clock, Package, User } from 'lucide-react'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="p-8 text-center">
                <p>Debes iniciar sesión para ver este pedido.</p>
                <Button className="mt-4" asChild>
                    <Link href="/login">Iniciar sesión</Link>
                </Button>
            </div>
        )
    }

    // Fetch order details with related listing info
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            *,
            listing:listings (
                id,
                title,
                description,
                price_cents,
                images,
                user_id
            ),
            seller:seller_id (
                id,
                name,
                username,
                avatar_url
            ),
            buyer:buyer_id (
                id,
                name,
                username,
                avatar_url
            )
        `)
        .eq('id', params.id)
        .single()

    if (error || !order) {
        console.error('Error fetching order:', error)
        return notFound()
    }

    // Determine if viewer is buyer or seller
    const isBuyer = order.buyer_id === user.id
    const isSeller = order.seller_id === user.id

    if (!isBuyer && !isSeller) {
        return (
            <div className="p-8 text-center">
                <p>No tienes permiso para ver este pedido.</p>
            </div>
        )
    }

    const listingImage = order.listing?.images?.[0] || '/placeholder-image.jpg'

    return (
        <div className="container max-w-2xl mx-auto px-4 py-8 pt-safe">
            <h1 className="text-2xl font-bold mb-6">Detalles del Pedido</h1>

            <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
                {/* Header Status */}
                <div className="bg-muted/30 p-4 border-b flex items-center gap-3">
                    {order.status === 'paid' || order.status === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                        <Clock className="h-6 w-6 text-orange-500" />
                    )}
                    <div>
                        <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                            Estado
                        </p>
                        <p className="font-medium capitalize text-lg">
                            {order.status === 'paid' ? 'Pagado' : order.status}
                        </p>
                    </div>
                </div>

                {/* Product Info */}
                <div className="p-6 flex flex-col sm:flex-row gap-6 border-b">
                    <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                        <Image
                            src={listingImage}
                            alt={order.listing?.title || 'Producto'}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <h2 className="text-xl font-semibold leading-tight">{order.listing?.title}</h2>
                        <p className="text-2xl font-bold text-primary">
                            {formatCurrency(order.total_amount_cents / 100)}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                            ID: {order.id.slice(0, 8)}...
                        </p>
                    </div>
                </div>

                {/* Counterparty Info */}
                <div className="p-6 border-b">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">
                        {isBuyer ? 'Vendedor' : 'Comprador'}
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold overflow-hidden">
                            {isBuyer ? (
                                order.seller?.avatar_url ? (
                                    <Image src={order.seller.avatar_url} alt="" width={40} height={40} className="object-cover h-full w-full" />
                                ) : (
                                    <User className="h-5 w-5" />
                                )
                            ) : (
                                order.buyer?.avatar_url ? (
                                    <Image src={order.buyer.avatar_url} alt="" width={40} height={40} className="object-cover h-full w-full" />
                                ) : (
                                    <User className="h-5 w-5" />
                                )
                            )}
                        </div>
                        <div>
                            <p className="font-medium">
                                {isBuyer ? order.seller?.name || 'Vendedor' : order.buyer?.name || 'Comprador'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                @{isBuyer ? order.seller?.username : order.buyer?.username}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto" asChild>
                            <Link href={`/messages?user=${isBuyer ? order.seller_id : order.buyer_id}`}>
                                Contactar
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 bg-muted/10 flex justify-end">
                    {/* Add more actions here later like "Confirm Receipt" or "Rate" */}
                    <Button variant="ghost" asChild>
                        <Link href="/market">Volver al mercado</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
