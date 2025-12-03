'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteFlat(flatId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autorizado')

    const { error } = await supabase
        .from('flats')
        .delete()
        .eq('id', flatId)
        .eq('user_id', user.id)

    if (error) throw new Error(error.message)

    revalidatePath('/flats')
    redirect('/flats')
}
