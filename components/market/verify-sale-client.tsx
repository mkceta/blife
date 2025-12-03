'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Package, Star } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface VerifySaleClientProps {
    listing: any
    token: string
}

export function VerifySaleClient({ listing, token }: VerifySaleClientProps) {
    const [step, setStep] = useState<'confirm' | 'review' | 'done'>('confirm')
    const [isLoading, setIsLoading] = useState(false)
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const firstPhoto = (listing.photos as any[])?.[0]?.url

    const handleConfirm = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            const { data, error } = await supabase.rpc('complete_sale', {
                token_input: token,
                buyer_id_input: user.id
            })

            if (error) throw error

            setStep('review')
            toast.success('Compra confirmada')
        } catch (error: any) {
            console.error('Error completing sale:', error)
            toast.error(error.message || 'Error al confirmar la compra')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmitReview = async () => {
        if (rating === 0) {
            toast.error('Por favor selecciona una valoración')
            return
        }

        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            // Insert review
            const { error } = await supabase
                .from('reviews')
                .insert({
                    reviewer_id: user.id,
                    reviewed_id: listing.user_id,
                    rating: rating,
                    comment: comment,
                    listing_id: listing.id
                })

            if (error) throw error

            toast.success('Valoración enviada')
            setStep('done')
            router.push('/profile?tab=purchases')
        } catch (error: any) {
            console.error('Error submitting review:', error)
            toast.error('Error al enviar valoración')
        } finally {
            setIsLoading(false)
        }
    }

    if (step === 'confirm') {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>Confirmar Compra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                        {firstPhoto ? (
                            <Image
                                src={firstPhoto}
                                alt={listing.title}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-12 w-12 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">{listing.title}</h2>
                        <p className="text-2xl font-bold text-primary">{(listing.price_cents / 100).toFixed(2)}€</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Vendedor:</span>
                            <span className="font-medium text-foreground">@{listing.user.alias_inst}</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 flex gap-3 items-start">
                        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                        <p>Al confirmar, este artículo se marcará como vendido y tú quedarás registrado como el comprador. Esto te permitirá valorar al vendedor.</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" size="lg" onClick={handleConfirm} disabled={isLoading}>
                        {isLoading ? 'Confirmando...' : 'Confirmar Compra'}
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    if (step === 'review') {
        return (
            <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle>¡Compra Confirmada!</CardTitle>
                    <p className="text-muted-foreground">¿Qué tal fue la experiencia con @{listing.user.alias_inst}?</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    className={cn(
                                        "h-10 w-10 transition-colors",
                                        star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    <Textarea
                        placeholder="Escribe un comentario (opcional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[100px]"
                    />
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button className="w-full" size="lg" onClick={handleSubmitReview} disabled={isLoading}>
                        {isLoading ? 'Enviando...' : 'Enviar Valoración'}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => router.push('/profile?tab=purchases')}>
                        Saltar por ahora
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return null
}
