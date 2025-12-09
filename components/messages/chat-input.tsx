'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

interface ChatInputProps {
    threadId: string
    replyTo?: any
    onCancelReply?: () => void
}

export function ChatInput({ threadId, replyTo, onCancelReply }: ChatInputProps) {
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const supabase = createClient()

    async function handleSend() {
        if (!message.trim()) return

        const currentMessage = message
        setMessage('') // Optimistic clear
        if (onCancelReply) onCancelReply()
        setIsSending(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            const { error } = await supabase
                .from('messages')
                .insert({
                    thread_id: threadId,
                    from_user: user.id,
                    body: currentMessage.trim(),
                    reply_to_id: replyTo?.id
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
        <div className="w-full relative">
            {replyTo && (
                <div className="flex items-center justify-between p-2 mb-2 bg-muted/50 rounded-lg border border-border text-sm">
                    <div className="flex flex-col truncate pr-4">
                        <span className="font-medium text-xs text-primary">Respondiendo a</span>
                        <span className="truncate opacity-70">{replyTo.body}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={onCancelReply}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </Button>
                </div>
            )}
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
        </div>
    )
}
