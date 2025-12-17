'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Verifies that the current user is authenticated and has admin privileges.
 * @throws Error if user is not authenticated or not an admin
 */
async function requireAdmin(supabase: Awaited<ReturnType<typeof createServerClient>>) {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('No autenticado')
    }

    // Verify admin role from database
    const { data: profile, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (error || !profile?.is_admin) {
        throw new Error('No autorizado: se requiere rol de administrador')
    }

    return user
}

export async function banUser(userId: string) {
    const supabase = await createServerClient()

    // Verify admin privileges before proceeding
    await requireAdmin(supabase)

    const { error } = await supabase
        .from('users')
        .update({ is_banned: true })
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function unbanUser(userId: string) {
    const supabase = await createServerClient()

    // Verify admin privileges before proceeding
    await requireAdmin(supabase)

    const { error } = await supabase
        .from('users')
        .update({ is_banned: false })
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}
