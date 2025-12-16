'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface ProfileMessageButtonProps {
    sellerId: string
    currentUserId?: string
}

export function ProfileMessageButton({ sellerId, currentUserId }: ProfileMessageButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    async function handleMessage() {
        if (!currentUserId) {
            router.push('/auth/login')
            return
        }

        if (currentUserId === sellerId) {
            return
        }

        setIsLoading(true)
        try {
            // Check if thread already exists
            const { data: existingThread } = await supabase
                .from('threads')
                .select('id')
                .eq('buyer_id', currentUserId)
                .eq('seller_id', sellerId)
                .is('listing_id', null)
                .is('flat_id', null)
                .maybeSingle()

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
            className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20"
            onClick={handleMessage}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <MessageCircle className="mr-2 h-4 w-4" />
            )}
            Enviar mensaje
        </Button>
    )
}
