'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

// --- LISTINGS (Market Products) ---

export async function deleteListingAction(listingId: string) {
    const supabase = await createClient()

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

    // @ts-ignore
    revalidateTag('market-listings')
    revalidatePath('/market', 'page')
    revalidatePath('/admin', 'page')
    revalidatePath(`/user/${user.id}`, 'page')
    redirect('/market')
}

export async function createListingActionWithRedirect(formData: any, photos: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
        .from('listings')
        .insert({
            user_id: user.id,
            title: formData.title,
            description: formData.description,
            price_cents: Math.round(Number(formData.price) * 100),
            category: formData.category,
            brand: formData.brand,
            size: formData.size,
            condition: formData.condition,
            photos: photos,
            status: 'active',
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    // @ts-ignore
    revalidateTag('market-listings')
    revalidatePath('/market', 'page')
    redirect(`/market/product?id=${data.id}`)
}


export async function updateListingAction(listingId: string, formData: any, photos: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autenticado')

    const { error } = await supabase
        .from('listings')
        .update({
            title: formData.title,
            description: formData.description,
            price_cents: Math.round(Number(formData.price) * 100),
            category: formData.category,
            brand: formData.brand,
            size: formData.size,
            condition: formData.condition,
            photos: photos,
        })
        .eq('id', listingId)
        .eq('user_id', user.id)

    if (error) throw new Error(error.message)

    // @ts-ignore
    revalidateTag('market-listings')
    revalidatePath('/market', 'page')
    revalidatePath(`/market/product?id=${listingId}`, 'page')
    redirect(`/market/product?id=${listingId}`)
}

export async function updateListingStatusAction(listingId: string, status: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autenticado')

    const { error } = await supabase
        .from('listings')
        .update({ status })
        .eq('id', listingId)
        .eq('user_id', user.id)

    if (error) throw new Error(error.message)

    // @ts-ignore
    revalidateTag('market-listings')
    revalidatePath('/market', 'page')
    revalidatePath(`/market/product?id=${listingId}`, 'page')
}

// --- FLATS (Pisos) ---

export async function createFlatAction(formData: any, photos: any[]) {
    const supabase = await createClient()
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
