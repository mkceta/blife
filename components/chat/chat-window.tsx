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
import { motion, AnimatePresence } from 'framer-motion'

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
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const channelRef = useRef<any>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout>()

    // Fetch initial messages and setup realtime
    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('thread_id', threadId)
                .order('created_at', { ascending: true })

            if (data) {
                setMessages(data)
                // Mark as read
                await supabase
                    .from('messages')
                    .update({ read: true })
                    .eq('thread_id', threadId)
                    .eq('read', false)
                    .neq('from_user', currentUserId)
            }
        }

        fetchMessages()

        // Setup channel with broadcast for typing
        const channel = supabase.channel(`thread:${threadId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `thread_id=eq.${threadId}`
            }, async (payload) => {
                const newMsg = payload.new as Message
                setMessages((prev) => [...prev, newMsg])

                if (newMsg.from_user !== currentUserId) {
                    await supabase
                        .from('messages')
                        .update({ read: true })
                        .eq('thread_id', threadId)
                        .eq('read', false)
                        .neq('from_user', currentUserId)
                }
            })
            .on('broadcast', { event: 'typing' }, (payload) => {
                console.log('📡 Received typing broadcast:', payload)
                // Only show typing if it's from the other user
                if (payload.payload.user_id !== currentUserId) {
                    console.log('✅ Setting isTyping to:', payload.payload.typing)
                    setIsTyping(payload.payload.typing)
                } else {
                    console.log('❌ Ignoring own typing event')
                }
            })
            .subscribe((status) => {
                console.log('📢 Channel status:', status)
            })

        channelRef.current = channel

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
            supabase.removeChannel(channel)
        }
    }, [threadId, supabase, currentUserId])

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isTyping])

    // Handle typing indicator
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value)

        console.log('⌨️ Input changed, length:', e.target.value.length, 'channel:', !!channelRef.current)

        // Broadcast typing status
        if (channelRef.current && e.target.value.length > 0) {
            console.log('📤 Sending typing=true')
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { user_id: currentUserId, typing: true }
            })

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }

            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                if (channelRef.current) {
                    channelRef.current.send({
                        type: 'broadcast',
                        event: 'typing',
                        payload: { user_id: currentUserId, typing: false }
                    })
                }
            }, 2000)
        } else if (channelRef.current && e.target.value.length === 0) {
            // Stop typing immediately if input is empty
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { user_id: currentUserId, typing: false }
            })
        }
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        setIsLoading(true)

        // Stop typing indicator
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { user_id: currentUserId, typing: false }
            })
        }

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
                <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                        const isMe = msg.from_user === currentUserId
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30
                                }}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-secondary text-secondary-foreground rounded-tl-none'
                                    }`}>
                                    <p>{msg.body}</p>
                                    <span className="text-[10px] opacity-70 block text-right mt-1">
                                        {formatDistanceToNow(new Date(msg.created_at), { locale: es })}
                                    </span>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {/* Typing Indicator */}
                <AnimatePresence>
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex justify-start"
                        >
                            <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-tl-none px-4 py-3 flex gap-1">
                                <motion.div
                                    className="w-2 h-2 bg-current rounded-full opacity-60"
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div
                                    className="w-2 h-2 bg-current rounded-full opacity-60"
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.div
                                    className="w-2 h-2 bg-current rounded-full opacity-60"
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-background pb-safe">
                <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={handleInputChange}
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
