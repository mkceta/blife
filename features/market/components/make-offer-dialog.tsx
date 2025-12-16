'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Euro } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MakeOfferDialogProps {
    listingId: string
    threadId: string
    currentPrice: number
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
}

export function MakeOfferDialog({ listingId, threadId, currentPrice, isOpen, onOpenChange, trigger }: MakeOfferDialogProps) {
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        onOpenChange?.(newOpen)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount) return

        const amountCents = Math.round(parseFloat(amount) * 100)

        if (amountCents <= 0) {
            toast.error('El precio debe ser mayor a 0')
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            // Create offer
            const { data: offer, error: offerError } = await supabase
                .from('product_offers')
                .insert({
                    listing_id: listingId,
                    buyer_id: user.id,
                    amount_cents: amountCents,
                    status: 'pending'
                })
                .select()
                .single()

            if (offerError) throw offerError

            // Send message about offer
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    thread_id: threadId,
                    from_user: user.id,
                    body: `He hecho una oferta de ${(amountCents / 100).toFixed(2)}€`,
                    offer_id: offer.id
                })

            if (msgError) throw msgError

            // Update thread last_message_at
            await supabase
                .from('threads')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', threadId)

            toast.success('Oferta enviada')
            handleOpenChange(false)
            setAmount('')
        } catch (error: unknown) {
            console.error('Error creating offer:', error)
            toast.error('Error al enviar la oferta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen !== undefined ? isOpen : open} onOpenChange={handleOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Hacer una oferta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Tu oferta</Label>
                        <div className="relative">
                            <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder={currentPrice.toString()}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-9"
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            El precio actual es {currentPrice}€
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !amount}>
                            {loading ? 'Enviando...' : 'Enviar oferta'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

