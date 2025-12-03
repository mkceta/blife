'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Euro, MessageCircle } from 'lucide-react'
import { MakeOfferDialog } from '@/components/market/make-offer-dialog'
import { ContactButton } from '@/components/market/contact-button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface ProductActionsProps {
    listingId: string
    sellerId: string
    currentUserId?: string
    price: number
    isOwner: boolean
}

export function ProductActions({ listingId, sellerId, currentUserId, price, isOwner }: ProductActionsProps) {
    const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [threadId, setThreadId] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleMakeOffer = async () => {
        if (!currentUserId) {
            router.push('/auth/login')
            return
        }

        setLoading(true)
        try {
            // Get or create thread
            let query = supabase
                .from('threads')
                .select('id')
                .eq('buyer_id', currentUserId)
                .eq('seller_id', sellerId)
                .eq('listing_id', listingId)

            const { data: existingThread } = await query.maybeSingle()

            if (existingThread) {
                setThreadId(existingThread.id)
                setIsOfferDialogOpen(true)
                return
            }

            // Create new thread
            const { data: newThread, error } = await supabase
                .from('threads')
                .insert({
                    buyer_id: currentUserId,
                    seller_id: sellerId,
                    listing_id: listingId,
                    status: 'open',
                    last_message_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            setThreadId(newThread.id)
            setIsOfferDialogOpen(true)

        } catch (error) {
            console.error('Error starting conversation:', error)
            toast.error('Error al iniciar la conversación')
        } finally {
            setLoading(false)
        }
    }

    if (isOwner) return null

    return (
        <div className="flex gap-3 w-full">
            <Button
                variant="outline"
                className="flex-1 h-12 rounded-full border-primary/20 hover:bg-primary/5 text-primary font-semibold"
                onClick={handleMakeOffer}
                disabled={loading}
            >
                <Euro className="mr-2 h-5 w-5" />
                Contraoferta
            </Button>

            <ContactButton
                itemId={listingId}
                itemType="listing"
                sellerId={sellerId}
                currentUserId={currentUserId}
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20"
            >
                <MessageCircle className="mr-2 h-5 w-5" />
                Contactar
            </ContactButton>

            {threadId && (
                <MakeOfferDialog
                    listingId={listingId}
                    threadId={threadId}
                    currentPrice={price}
                    isOpen={isOfferDialogOpen}
                    onOpenChange={setIsOfferDialogOpen}
                />
            )}
        </div>
    )
}
