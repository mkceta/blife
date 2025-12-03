'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, MoreVertical } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

interface Message {
    id: string
    body: string
    created_at: string
    from_user: string
}

interface ChatWindowProps {
    threadId: string
    currentUserId: string
    otherUser: {
        alias_inst: string
        avatar_url: string
    }
    listingTitle: string
}

export function ChatWindow({ threadId, currentUserId, otherUser, listingTitle }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Fetch initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('thread_id', threadId)
                .order('created_at', { ascending: true })

            if (data) {
                setMessages(data)
                // Mark thread as read when entering
                await supabase
                    .from('messages')
                    .update({ read: true })
                    .eq('thread_id', threadId)
                    .eq('read', false)
                    .neq('from_user', currentUserId)
            }
        }

        fetchMessages()

        // Realtime subscription
        const channel = supabase
            .channel(`thread:${threadId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `thread_id=eq.${threadId}`
            }, async (payload) => {
                const newMsg = payload.new as Message
                setMessages((prev) => [...prev, newMsg])

                // If message is from other user, mark as read
                if (newMsg.from_user !== currentUserId) {
                    await supabase
                        .from('messages')
                        .update({ read: true })
                        .eq('thread_id', threadId)
                        .eq('read', false)
                        .neq('from_user', currentUserId)
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [threadId, supabase, currentUserId])

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        setIsLoading(true)
        const { error } = await supabase
            .from('messages')
            .insert({
                thread_id: threadId,
                from_user: currentUserId,
                body: newMessage.trim()
            })

        if (error) {
            toast.error('Error al enviar mensaje')
        } else {
            setNewMessage('')
            // Update thread last_message_at
            await supabase
                .from('threads')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', threadId)
        }
        setIsLoading(false)
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={otherUser.avatar_url} />
                        <AvatarFallback>{otherUser.alias_inst?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold text-sm">@{otherUser.alias_inst}</h2>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{listingTitle}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.from_user === currentUserId
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe
                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                : 'bg-secondary text-secondary-foreground rounded-tl-none'
                                }`}>
                                <p>{msg.body}</p>
                                <span className="text-[10px] opacity-70 block text-right mt-1">
                                    {formatDistanceToNow(new Date(msg.created_at), { locale: es })}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-background pb-safe">
                <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 rounded-full bg-secondary border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={isLoading || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
