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
    listingId
}: ChatListProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const bottomRef = useRef<HTMLDivElement>(null)
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
                            msg.id === updatedMessage.id ? updatedMessage : msg
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

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4 scrollbar-thin">
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
                    <ChatBubble
                        key={msg.id}
                        message={msg}
                        isCurrentUser={isCurrentUser}
                        showTail={isFirstInSequence}
                    />
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
