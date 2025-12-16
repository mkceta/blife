'use client'

import { useState } from 'react'
import { ChatInput } from '@/features/messages/components/chat-input'
import { ChatList } from '@/features/messages/components/chat-list'
import { ChatHeader } from '@/features/messages/components/chat-header'
import type { Photo, User, ChatMessage } from '@/lib/types'

// Thread-specific types (exported for use in server component)
export interface ThreadUser {
    id: string
    alias_inst: string
    avatar_url?: string | null
    last_seen?: string | null
}

export interface ThreadListing {
    id: string
    title: string
    photos: Photo[]
    price_cents: number
    status: string
    user_id: string
    buyer_id?: string
}

export interface ThreadFlat {
    id: string
    title: string
    photos: Photo[]
    rent_cents: number
}

export interface ThreadData {
    id: string
    buyer_id: string
    seller_id: string
    buyer: ThreadUser
    seller: ThreadUser
    listing?: ThreadListing | null
    flat?: ThreadFlat | null
}

// Re-export ChatMessage as ThreadMessage for backwards compatibility
export type ThreadMessage = ChatMessage

interface MessageThreadContentProps {
    thread: ThreadData
    initialMessages: ChatMessage[]
    currentUser: {
        id: string
        email?: string
    }
}

export function MessageThreadContent({
    thread,
    initialMessages,
    currentUser
}: MessageThreadContentProps) {
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)

    const otherUser = thread.buyer_id === currentUser.id ? thread.seller : thread.buyer
    const item = thread.listing || thread.flat
    const itemType = thread.listing ? 'market' : 'flats'
    const photo = item?.photos?.[0]?.url
    const price = thread.listing
        ? `${(thread.listing.price_cents / 100).toFixed(0)}€`
        : thread.flat
            ? `${(thread.flat.rent_cents / 100).toFixed(0)}€/mes`
            : null

    // Create User-compatible object for child components
    const currentUserForComponents: User = {
        id: currentUser.id,
        email: currentUser.email || '',
        created_at: '',
        alias_inst: '',
        role: 'user',
        stripe_connected: false
    }

    return (
        <div className="flex flex-col h-full w-full">
            <ChatHeader
                otherUser={otherUser}
                item={item ? { id: item.id, title: item.title, price, photo } : null}
                itemType={itemType}
                thread={thread}
                currentUser={currentUserForComponents}
            />

            <ChatList
                initialMessages={initialMessages}
                currentUser={currentUserForComponents}
                threadId={thread.id}
                otherUserAlias={otherUser?.alias_inst}
                showRateDialog={false}
                sellerId={thread.seller_id}
                sellerName={thread.seller.alias_inst}
                listingId={thread.listing?.id}
                onReply={(msg) => setReplyTo(msg)}
            />

            <div className="flex-none p-4 bg-background/80 backdrop-blur-md border-t border-border z-20 pb-safe">
                <ChatInput
                    threadId={thread.id}
                    replyTo={replyTo as unknown as Parameters<typeof ChatInput>[0]['replyTo']}
                    onCancelReply={() => setReplyTo(null)}
                />
            </div>
        </div>
    )
}
