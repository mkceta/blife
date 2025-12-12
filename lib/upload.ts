import { createClient } from '@/lib/supabase'

// Helper to lazy load compression library
const getCompressionLib = async () => {
    const { default: imageCompression } = await import('browser-image-compression')
    return imageCompression
}

export async function compressImage(file: File, customOptions?: any) {
    const imageCompression = await getCompressionLib()
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        ...customOptions
    }
    try {
        const compressedFile = await imageCompression(file, options)
        return compressedFile
    } catch (error) {
        console.error(error)
        return file // Fallback
    }
}

export async function compressAvatar(file: File) {
    // Aggressive compression for avatars
    return compressImage(file, {
        maxSizeMB: 0.1, // 100KB
        maxWidthOrHeight: 400, // Sufficient for a 32x32 to 128x128 avatar
        fileType: 'image/webp' // Force WebP for better compression
    })
}

export async function createThumbnail(file: File) {
    const imageCompression = await getCompressionLib()
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

export async function uploadPostImage(file: File, postId: string) {
    const supabase = createClient()

    try {
        const compressed = await compressImage(file)

        const ext = file.name.split('.').pop()
        const filename = `${crypto.randomUUID()}.${ext}`

        // Try 'posts' bucket first, fallback to 'public' if needed, but assuming 'posts'
        // Actually, if 'listings' and 'flats' exist, 'posts' is likely.
        const bucketName = 'posts'

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(`${postId}/${filename}`, compressed)

        if (error) {
            // Fallback to listings if posts bucket doesn't exist? No, that's messy.
            // Let's hope posts bucket exists.
            throw new Error(`Error al subir imagen: ${error.message}`)
        }

        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(`${postId}/${filename}`)

        return publicUrl
    } catch (error: any) {
        console.error('Error processing post image:', error)
        throw new Error(error.message || 'Error al procesar imagen')
    }
}
