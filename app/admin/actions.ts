'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function banUser(userId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('users')
        .update({ is_banned: true })
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function unbanUser(userId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('users')
        .update({ is_banned: false })
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}
