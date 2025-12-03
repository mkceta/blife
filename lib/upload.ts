import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase'

export async function compressImage(file: File) {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
    }
    try {
        const compressedFile = await imageCompression(file, options)
        return compressedFile
    } catch (error) {
        console.error(error)
        return file // Fallback
    }
}

export async function createThumbnail(file: File) {
    const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 400,
        useWebWorker: true,
    }
    try {
        return await imageCompression(file, options)
    } catch (error) {
        return file
    }
}

export async function uploadListingImages(files: File[], listingId: string) {
    const supabase = createClient()
    const uploaded = []

    for (const file of files) {
        try {
            const compressed = await compressImage(file)
            const thumb = await createThumbnail(file)

            const ext = file.name.split('.').pop()
            const filename = `${crypto.randomUUID()}.${ext}`

            // Upload Original
            const { data: origData, error: origError } = await supabase.storage
                .from('listings')
                .upload(`${listingId}/originals/${filename}`, compressed)

            if (origError) {
                console.error('Error uploading original:', origError)
                throw new Error(`Error al subir imagen: ${origError.message}`)
            }

            // Upload Thumb
            const { data: thumbData, error: thumbError } = await supabase.storage
                .from('listings')
                .upload(`${listingId}/thumbs/${filename}`, thumb)

            if (thumbError) {
                console.error('Error uploading thumbnail:', thumbError)
                throw new Error(`Error al subir miniatura: ${thumbError.message}`)
            }

            // Get Public URLs
            const { data: { publicUrl: url } } = supabase.storage.from('listings').getPublicUrl(`${listingId}/originals/${filename}`)
            const { data: { publicUrl: thumbUrl } } = supabase.storage.from('listings').getPublicUrl(`${listingId}/thumbs/${filename}`)

            uploaded.push({
                url,
                thumb_url: thumbUrl,
                size_bytes: compressed.size
            })
        } catch (error: any) {
            console.error('Error processing image:', error)
            throw new Error(error.message || 'Error al procesar imagen')
        }
    }

    return uploaded
}

export async function uploadFlatImages(files: File[], flatId: string) {
    const supabase = createClient()
    const uploaded = []

    for (const file of files) {
        try {
            const compressed = await compressImage(file)
            const thumb = await createThumbnail(file)

            const ext = file.name.split('.').pop()
            const filename = `${crypto.randomUUID()}.${ext}`

            // Upload Original
            const { data: origData, error: origError } = await supabase.storage
                .from('flats')
                .upload(`${flatId}/originals/${filename}`, compressed)

            if (origError) {
                console.error('Error uploading original:', origError)
                throw new Error(`Error al subir imagen: ${origError.message}`)
            }

            // Upload Thumb
            const { data: thumbData, error: thumbError } = await supabase.storage
                .from('flats')
                .upload(`${flatId}/thumbs/${filename}`, thumb)

            if (thumbError) {
                console.error('Error uploading thumbnail:', thumbError)
                throw new Error(`Error al subir miniatura: ${thumbError.message}`)
            }

            // Get Public URLs
            const { data: { publicUrl: url } } = supabase.storage.from('flats').getPublicUrl(`${flatId}/originals/${filename}`)
            const { data: { publicUrl: thumbUrl } } = supabase.storage.from('flats').getPublicUrl(`${flatId}/thumbs/${filename}`)

            uploaded.push({
                url,
                thumb_url: thumbUrl,
                size_bytes: compressed.size
            })
        } catch (error: any) {
            console.error('Error processing image:', error)
            throw new Error(error.message || 'Error al procesar imagen')
        }
    }

    return uploaded
}
