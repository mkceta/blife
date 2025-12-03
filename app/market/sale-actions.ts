'use server'

import { createClient } from '@/lib/supabase-server'

export async function getListingByToken(token: string) {
    const supabase = await createClient()

    // First try 'listings' table if it exists (for generic market items)
    const { data: listing, error } = await supabase
        .from('listings')
        .select('*')
        .eq('sale_token', token)
        .single()

    if (listing) return listing

    // If not found, try 'flats' table
    const { data: flat, error: flatError } = await supabase
        .from('flats')
        .select('*')
        .eq('sale_token', token)
        .single()

    if (flat) return flat

    return null
}

export async function verifySaleCode(code: string) {
    const supabase = await createClient()

    // Check listings
    const { data: listing } = await supabase
        .from('listings')
        .select('sale_token')
        .eq('sale_code', code)
        .single()

    if (listing?.sale_token) {
        return { token: listing.sale_token, error: undefined }
    }

    // Check flats
    const { data: flat } = await supabase
        .from('flats')
        .select('sale_token')
        .eq('sale_code', code)
        .single()

    if (flat?.sale_token) {
        return { token: flat.sale_token, error: undefined }
    }

    return { error: 'Código inválido', token: undefined }
}

export async function generateSaleToken(listingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autorizado', token: undefined, code: undefined }

    // Generate random 6-char code and UUID token
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const token = crypto.randomUUID()

    // Try updating listing first
    const { error: listingError } = await supabase
        .from('listings')
        .update({ sale_code: code, sale_token: token })
        .eq('id', listingId)
        .eq('user_id', user.id)

    if (!listingError) {
        return { token, code, error: undefined }
    }

    // If listing update failed (maybe it's a flat?), try flat
    const { error: flatError } = await supabase
        .from('flats')
        .update({ sale_code: code, sale_token: token })
        .eq('id', listingId)
        .eq('user_id', user.id)

    if (!flatError) {
        return { token, code, error: undefined }
    }

    return { error: 'Error al generar código', token: undefined, code: undefined }
}
