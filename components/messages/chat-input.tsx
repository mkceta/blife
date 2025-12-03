'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface ChatInputProps {
    threadId: string
}

export function ChatInput({ threadId }: ChatInputProps) {
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const supabase = createClient()

    async function handleSend() {
        if (!message.trim()) return

        const currentMessage = message
        setMessage('') // Optimistic clear
        setIsSending(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            const { error } = await supabase
                .from('messages')
                .insert({
                    thread_id: threadId,
                    from_user: user.id,
                    body: currentMessage.trim()
                })

            if (error) throw error

            // Update thread last_message_at
            await supabase
                .from('threads')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', threadId)

        } catch (error: any) {
            console.error('ChatInput: Error sending message:', error)
            const errorMessage = error.message || 'Error al enviar mensaje'
            toast.error(errorMessage)
            setMessage(currentMessage) // Restore message on error
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="flex items-end gap-2 w-full">
            <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="min-h-[50px] max-h-[150px] resize-none bg-background/50 focus:bg-background transition-colors"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                    }
                }}
            />
            <Button
                onClick={handleSend}
                disabled={!message.trim() || isSending}
                size="icon"
                className="h-[50px] w-[50px] shrink-0 rounded-xl"
            >
                <Send className="h-5 w-5" />
            </Button>
        </div>
    )
}
