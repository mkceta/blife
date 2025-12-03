'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface ContactButtonProps {
    itemId: string
    itemType: 'listing' | 'flat'
    sellerId: string
    currentUserId?: string
    className?: string
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    children?: React.ReactNode
}

export function ContactButton({ itemId, itemType, sellerId, currentUserId, className, variant, size = "lg", children }: ContactButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    async function handleContact() {
        if (!currentUserId) {
            router.push('/auth/login')
            return
        }

        if (currentUserId === sellerId) {
            toast.error('No puedes contactar contigo mismo')
            return
        }

        setIsLoading(true)
        try {
            // Check if thread already exists
            let query = supabase
                .from('threads')
                .select('id')
                .eq('buyer_id', currentUserId)
                .eq('seller_id', sellerId)

            if (itemType === 'listing' && itemId) {
                query = query.eq('listing_id', itemId)
            } else if (itemType === 'flat' && itemId) {
                query = query.eq('flat_id', itemId)
            } else {
                // Direct message: find thread with NO listing and NO flat
                query = query.is('listing_id', null).is('flat_id', null)
            }

            const { data: existingThread } = await query.maybeSingle()

            if (existingThread) {
                router.push(`/messages/chat?id=${existingThread.id}`)
                return
            }

            // Create new thread
            const { data: newThread, error } = await supabase
                .from('threads')
                .insert({
                    buyer_id: currentUserId,
                    seller_id: sellerId,
                    listing_id: itemType === 'listing' ? itemId : null,
                    flat_id: itemType === 'flat' ? itemId : null,
                    status: 'open',
                    last_message_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            router.push(`/messages/chat?id=${newThread.id}`)

        } catch (error) {
            console.error('Error starting conversation:', error)
            toast.error('Error al iniciar conversación')
        } finally {
            setIsLoading(false)
        }
    }

    if (currentUserId === sellerId) return null

    return (
        <Button
            className={className}
            variant={variant}
            size={size}
            onClick={handleContact}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className={size === 'icon' ? "h-5 w-5 animate-spin" : "mr-2 h-5 w-5 animate-spin"} />
            ) : children ? (
                children
            ) : (
                <>
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Contactar
                </>
            )}
        </Button>
    )
}
