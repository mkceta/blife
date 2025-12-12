
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ChatInput } from '@/components/messages/chat-input'
import { ChatList } from '@/components/messages/chat-list'
import { ChatHeader } from '@/components/messages/chat-header'
import { Loader2 } from 'lucide-react'

// We need to unwrap params in Next.js 15+ (or recent 14) if they are async or just to be safe.
// But mostly in client components we access them via props.
export default function MessageThreadPage({ params }: { params: { id: string } }) {
    const id = params.id
    const router = useRouter()
    const [thread, setThread] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [replyTo, setReplyTo] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            if (!id) return

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }
            setCurrentUser(user)

            // Fetch thread details
            const { data: threadData, error } = await supabase
                .from('threads')
                .select(`
              *,
              buyer:users!buyer_id(id, alias_inst, avatar_url, last_seen),
              seller:users!seller_id(id, alias_inst, avatar_url, last_seen),
              listing:listings(id, title, photos, price_cents, status, user_id, buyer_id),
              flat:flats(id, title, photos, rent_cents)
            `)
                .eq('id', id)
                .single()

            if (error || !threadData) {
                console.error('Error fetching thread:', error)
                // If not found, maybe redirect to inbox
                router.push('/messages')
                return
            }

            // Verify participation
            if (threadData.buyer_id !== user.id && threadData.seller_id !== user.id) {
                router.push('/messages')
                return
            }

            setThread(threadData)

            // Mark notifications for this thread as read
            const { error: notifError } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .ilike('link', `%${threadData.id}%`)
                .eq('read', false)

            if (notifError) console.error('Error marking notifications:', notifError)

            // Mark incoming messages as read
            await supabase
                .from('messages')
                .update({ read: true })
                .eq('thread_id', threadData.id)
                .neq('from_user', user.id)
                .eq('read', false)

            // Fetch messages for this thread
            const { data: messagesData } = await supabase
                .from('messages')
                .select('*, offer:product_offers(*), reply_to:messages!reply_to_id(id, body, from_user)')
                .eq('thread_id', threadData.id)
                .order('created_at', { ascending: true })

            if (messagesData) {
                setMessages(messagesData)
            }
            setLoading(false)
        }

        fetchData()
    }, [id, router, supabase])

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    if (!thread) return <div className="flex items-center justify-center h-full">Chat no encontrado</div>

    const otherUser = thread.buyer_id === currentUser.id ? thread.seller : thread.buyer
    const item = thread.listing || thread.flat
    const itemType = thread.listing ? 'market' : 'flats'
    const photo = item?.photos?.[0]?.url
    const price = thread.listing
        ? `${(thread.listing.price_cents / 100).toFixed(0)}€`
        : thread.flat
            ? `${(thread.flat.rent_cents / 100).toFixed(0)}€/mes`
            : null

    return (
        <div className="flex flex-col h-full w-full">
            <ChatHeader
                otherUser={otherUser}
                item={item ? { id: item.id, title: item.title, price, photo } : null}
                itemType={itemType}
                thread={thread}
                currentUser={currentUser}
            />

            <ChatList
                initialMessages={messages}
                currentUser={currentUser}
                threadId={thread.id}
                otherUserAlias={otherUser?.alias_inst}
                showRateDialog={false}
                sellerId={thread.seller_id}
                sellerName={thread.seller.alias_inst}
                listingId={thread.listing?.id}
                onReply={setReplyTo}
            />

            <div className="flex-none p-4 bg-background/80 backdrop-blur-md border-t border-border z-20 pb-safe">
                <ChatInput
                    threadId={thread.id}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                />
            </div>
        </div>
    )
}
