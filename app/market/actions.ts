'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { listingSchema } from '@/lib/schemas'

// --- LISTINGS (Market Products) ---

export async function deleteListingAction(listingId: string) {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('No autenticado')
    }

    const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('user_id', user.id)

    if (error) {
        throw new Error(error.message)
    }

    // Attempt to delete images (non-blocking failure, just log)
    try {
        const { deleteListingImages } = await import('@/lib/storage-server')
        await deleteListingImages(listingId)
    } catch (cleanupError) {
        console.error('Error cleaning up listing images:', cleanupError)
    }

    revalidateTag('market', 'max')
    revalidateTag('listings', 'max')
    revalidatePath('/market', 'page')
    revalidatePath('/admin', 'page')
    revalidatePath(`/user/${user.id}`, 'page')
    revalidatePath('/market', 'page')
    revalidatePath('/admin', 'page')
    revalidatePath(`/user/${user.id}`, 'page')
    return { success: true }
}

export async function createListingAction(formData: Record<string, any>, photos: { url: string }[]) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autenticado')

    const validation = listingSchema.safeParse(formData)
    if (!validation.success) {
        throw new Error(validation.error.issues[0].message)
    }
    const safeData = validation.data

    const { data, error } = await supabase
        .from('listings')
        .insert({
            user_id: user.id,
            title: safeData.title,
            description: safeData.description,
            price_cents: Math.round(Number(safeData.price) * 100),
            category: safeData.category,
            brand: safeData.brand,
            size: safeData.size,
            condition: safeData.condition,
            photos: photos,
            status: 'active',
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    revalidateTag('market', 'max')
    revalidateTag('listings', 'max')
    revalidatePath('/market', 'page')
    revalidatePath('/market', 'page')
    return data
}


export async function updateListingAction(listingId: string, formData: Record<string, any>, photos: { url: string }[]) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autenticado')

    const validation = listingSchema.safeParse(formData)
    if (!validation.success) {
        throw new Error(validation.error.issues[0].message)
    }
    const safeData = validation.data

    const { error } = await supabase
        .from('listings')
        .update({
            title: safeData.title,
            description: safeData.description,
            price_cents: Math.round(Number(safeData.price) * 100),
            category: safeData.category,
            brand: safeData.brand,
            size: safeData.size,
            condition: safeData.condition,
            photos: photos,
        })
        .eq('id', listingId)
        .eq('user_id', user.id)

    if (error) throw new Error(error.message)

    // @ts-ignore
    revalidateTag('market-listings')
    revalidatePath('/market', 'page')
    revalidatePath(`/market/product?id=${listingId}`, 'page')

    return { success: true }
}

export async function updateListingStatusAction(listingId: string, status: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autenticado')

    const { error } = await supabase
        .from('listings')
        .update({ status })
        .eq('id', listingId)
        .eq('user_id', user.id)

    if (error) throw new Error(error.message)

    revalidateTag('market', 'max')
    revalidateTag('listings', 'max')
    revalidatePath('/market', 'page')
    revalidatePath(`/market/product?id=${listingId}`, 'page')
}

// --- FLATS (Pisos) ---

export async function createFlatAction(formData: any, photos: any[]) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
        .from('flats')
        .insert({
            user_id: user.id,
            title: formData.title,
            description: formData.description,
            rent_cents: Math.round(formData.rent * 100),
            rooms: formData.rooms,
            baths: formData.baths,
            area_m2: formData.area_m2,
            location_area: formData.location_area || 'custom',
            roommates_current: formData.roommates_current,
            lat: formData.lat,
            lng: formData.lng,
            amenities: formData.amenities || [],
            photos: photos,
            status: 'active',
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    // @ts-ignore
    revalidateTag('market-listings')
    // @ts-ignore
    revalidateTag('flats')
    revalidatePath('/market', 'page')
    revalidatePath('/flats', 'page')
    redirect(`/flats/${data.id}`)
}

export async function updateFlatAction(flatId: string, formData: any, photos: any[]) {
    // Implement update logic if needed
}
