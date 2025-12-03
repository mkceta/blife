'use server'

import { createClient } from '@/lib/supabase-server'

export async function markNotificationsAsReadByType(type: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('type', type)
        .eq('read', false)
}
