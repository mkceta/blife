'use server'

import { createClient } from '@/lib/supabase-server'

export async function getUnreadCount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { count: 0 }

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

    if (error) {
        console.error('Error fetching unread count:', error)
        return { count: 0 }
    }

    return { count: count || 0 }
}
