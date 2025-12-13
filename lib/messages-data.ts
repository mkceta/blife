import { createClient } from '@/lib/supabase-server'
import { cache } from 'react'

export const getThreads = cache(async (searchQuery?: string) => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    let query = supabase
        .from('threads')
        .select(`
            *,
            listing:listings(id, title, photos, price_cents, status, user_id),
            flat:flats(id, title, photos, rent_cents, status, user_id),
            messages!messages_thread_id_fkey(id, body, created_at, read, from_user),
            buyer:users!threads_buyer_id_fkey(id, alias_inst, avatar_url),
            seller:users!threads_seller_id_fkey(id, alias_inst, avatar_url)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })

    const { data, error } = await query

    if (error) {
        console.error('Error fetching threads:', error)
        return []
    }

    let threads = data || []

    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase()
        threads = threads.filter((thread: any) => {
            const otherUser = thread.buyer_id === user.id ? thread.seller : thread.buyer
            const itemName = thread.listing?.title || thread.flat?.title || ''
            return (
                otherUser?.alias_inst?.toLowerCase().includes(lowerQuery) ||
                itemName.toLowerCase().includes(lowerQuery)
            )
        })
    }

    return threads
})

export const getUnreadCounts = cache(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return {}

    const { data } = await supabase
        .from('messages')
        .select('thread_id')
        .eq('read', false)
        .neq('from_user', user.id)

    const counts: Record<string, number> = {}
    data?.forEach((msg: any) => {
        counts[msg.thread_id] = (counts[msg.thread_id] || 0) + 1
    })

    return counts
})
