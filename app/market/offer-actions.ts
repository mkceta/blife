'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function respondToOffer(offerId: string, accept: boolean, threadId: string) {
    const supabase = await createClient()

    const status = accept ? 'accepted' : 'rejected'

    const { error } = await supabase
        .from('offers')
        .update({ status })
        .eq('id', offerId)

    if (error) throw error

    revalidatePath(`/messages/chat`)
}
