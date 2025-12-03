'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

interface RateUserDialogProps {
    sellerId: string
    sellerName: string
    listingId: string
}

export function RateUserDialog({ sellerId, sellerName, listingId }: RateUserDialogProps) {
    const [open, setOpen] = useState(false)
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    async function handleSubmit() {
        if (rating === 0) {
            toast.error('Por favor selecciona una valoración')
            return
        }

        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            const { error } = await supabase
                .from('reviews')
                .insert({
                    seller_id: sellerId,
                    buyer_id: user.id,
                    stars: rating,
                    text: comment,
                    listing_id: listingId
                })

            if (error) throw error

            toast.success('Valoración enviada')
            setOpen(false)
        } catch (error) {
            console.error('Error submitting review:', error)
            toast.error('Error al enviar valoración')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20">
                    <Star className="mr-2 h-4 w-4" />
                    Valorar a @{sellerName}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Valorar experiencia</DialogTitle>
                    <DialogDescription>
                        ¿Qué tal fue la compra con @{sellerName}?
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    className={cn(
                                        "h-8 w-8 transition-colors",
                                        star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    <Textarea
                        placeholder="Escribe un comentario (opcional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Enviando...' : 'Enviar valoración'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
