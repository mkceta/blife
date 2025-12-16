import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { MessageThreadContent, ThreadData, ThreadMessage } from '@/features/messages/components/message-thread-content'

/**
 * Message Thread Page - Server Component
 * 
 * Fetches thread data server-side for:
 * - Faster initial page load (no client-side loading spinner)
 * - SEO benefits (though messages are private)
 * - Proper authentication check before rendering
 * 
 * The MessageThreadContent client component handles:
 * - Real-time message updates
 * - Reply state management
 * - Message sending
 */
export default async function MessageThreadPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createServerClient()

    // Get current user (auth check)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/auth/login?redirectTo=/messages/' + id)
    }

    // Fetch thread details with joined data
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
        redirect('/messages')
    }

    // Verify user participation in this thread
    if (threadData.buyer_id !== user.id && threadData.seller_id !== user.id) {
        redirect('/messages')
    }

    // Mark notifications for this thread as read (fire-and-forget)
    supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .ilike('link', `%${threadData.id}%`)
        .eq('read', false)
        .then(({ error: notifError }) => {
            if (notifError) console.error('Error marking notifications:', notifError)
        })

    // Mark incoming messages as read (fire-and-forget)
    supabase
        .from('messages')
        .update({ read: true })
        .eq('thread_id', threadData.id)
        .neq('from_user', user.id)
        .eq('read', false)
        .then(() => { })

    // Fetch messages for this thread
    const { data: messagesData } = await supabase
        .from('messages')
        .select('*, offer:product_offers(*), reply_to:messages!reply_to_id(id, body, from_user)')
        .eq('thread_id', threadData.id)
        .order('created_at', { ascending: true })

    // Cast to proper types
    const thread = threadData as unknown as ThreadData
    const messages = (messagesData || []) as unknown as ThreadMessage[]

    return (
        <MessageThreadContent
            thread={thread}
            initialMessages={messages}
            currentUser={{
                id: user.id,
                email: user.email
            }}
        />
    )
}
