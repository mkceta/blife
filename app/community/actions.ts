'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPostAction(content: string, categories: string[], photoUrl?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autenticado')

    const { error } = await supabase
        .from('posts')
        .insert({
            user_id: user.id,
            text: content,
            category: categories,
            photo_url: photoUrl || null,
        })

    if (error) throw new Error(error.message)

    revalidatePath('/community')
    redirect('/community')
}

export async function deletePostAction(postId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autenticado')

    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id) // Security check

    if (error) throw new Error(error.message)

    revalidatePath('/community')
    // No redirect needed if called from list, but if called from detail page, client should handle it.
}
