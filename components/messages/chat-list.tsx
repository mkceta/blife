'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { ChatBubble } from './chat-bubble'
import { RateUserDialog } from '@/components/reviews/rate-user-dialog'

interface Message {
    id: string
    body: string
    created_at: string
    from_user: string
    thread_id: string
    read?: boolean
    type?: 'text' | 'offer'
    offer_id?: string
    offer?: any
    reply_to?: {
        id: string
        body: string
        from_user: string
    }
    reply_to_id?: string
    image_url?: string
}

interface ChatListProps {
    initialMessages: Message[]
    currentUser: any
    threadId: string
    otherUserAlias?: string
    isSold?: boolean
    showRateDialog?: boolean
    sellerId?: string
    sellerName?: string
    listingId?: string
    onReply?: (message: Message) => void
}

export function ChatList({
    initialMessages,
    currentUser,
    threadId,
    otherUserAlias,
    isSold,
    showRateDialog,
    sellerId,
    sellerName,
    listingId,
    onReply
}: ChatListProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const bottomRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        setMessages(initialMessages)
    }, [initialMessages])

    useEffect(() => {
        // Scroll to bottom on mount and when messages change
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        const channel = supabase
            .channel(`thread-${threadId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `thread_id=eq.${threadId}`
                },
                async (payload) => {
                    const newMessage = payload.new as Message

                    // Fetch reply_to info if exists
                    let replyInfo = null
                    if (newMessage['reply_to_id']) {
                        const { data } = await supabase
                            .from('messages')
                            .select('id, body, from_user, image_url')
                            .eq('id', newMessage['reply_to_id'])
                            .single()
                        replyInfo = data
                    }

                    // If it's an offer, we need to fetch the offer details
                    if (newMessage.type === 'offer' && newMessage.offer_id) {
                        const { data: offer } = await supabase
                            .from('product_offers')
                            .select('*')
                            .eq('id', newMessage.offer_id)
                            .single()

                        if (offer) {
                            newMessage.offer = offer
                        }
                    }

                    if (replyInfo) {
                        newMessage.reply_to = replyInfo
                    }

                    setMessages((prev) => [...prev, newMessage])

                    // If message is from other user, mark as read immediately
                    if (newMessage.from_user !== currentUser.id) {
                        await supabase
                            .from('messages')
                            .update({ read: true })
                            .eq('thread_id', threadId)
                            .eq('read', false)
                            .neq('from_user', currentUser.id)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `thread_id=eq.${threadId}`
                },
                (payload) => {
                    const updatedMessage = payload.new as Message
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
                        )
                    )
                }
            )
            .subscribe()

        // Subscribe to offer updates
        const offersChannel = supabase
            .channel(`offers-${threadId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'product_offers'
                },
                (payload) => {
                    const updatedOffer = payload.new
                    setMessages((prev) =>
                        prev.map((msg) => {
                            if (msg.offer_id === updatedOffer.id) {
                                return { ...msg, offer: updatedOffer }
                            }
                            return msg
                        })
                    )
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            supabase.removeChannel(offersChannel)
        }
    }, [threadId, currentUser.id, supabase])

    const scrollToMessage = (messageId: string) => {
        const element = document.getElementById(`message-${messageId}`)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('bg-primary/10')
            setTimeout(() => {
                element.classList.remove('bg-primary/10')
            }, 2000)
        }
    }

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-4 scrollbar-thin min-h-0">
            {showRateDialog && sellerId && sellerName && listingId && (
                <div className="mb-4">
                    <RateUserDialog sellerId={sellerId} sellerName={sellerName} listingId={listingId} />
                </div>
            )}

            {messages.map((msg, index) => {
                const isCurrentUser = msg.from_user === currentUser.id
                const prevMsg = messages[index - 1]
                const isFirstInSequence = !prevMsg || prevMsg.from_user !== msg.from_user

                return (
                    <div key={msg.id} id={`message-${msg.id}`} className="transition-colors duration-500 rounded-lg">
                        <ChatBubble
                            message={msg as any}
                            isCurrentUser={isCurrentUser}
                            showTail={isFirstInSequence}
                            onReply={onReply}
                            onScrollToMessage={scrollToMessage}
                        />
                    </div>
                )
            })}

            {messages.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                    Inicia la conversación con @{otherUserAlias}
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    )
}
