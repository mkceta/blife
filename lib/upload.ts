import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

// Helper to lazy load compression library
const getCompressionLib = async () => {
    const { default: imageCompression } = await import('browser-image-compression')
    return imageCompression
}

import type { Options } from 'browser-image-compression'

export async function compressImage(file: File, customOptions?: Partial<Options>) {
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

import { SupabaseClient } from '@supabase/supabase-js'

// Internal helper to handle single image processing and upload
async function processAndUploadImage(
    file: File,
    bucket: string,
    folderId: string,
    supabase: SupabaseClient
) {
    try {
        // Parallelize compression and thumbnail generation
        const [compressed, thumb] = await Promise.all([
            compressImage(file),
            createThumbnail(file)
        ])

        const ext = file.name.split('.').pop()
        const filename = `${uuidv4()}.${ext}`

        // Parallelize uploads
        const [origResult, thumbResult] = await Promise.all([
            supabase.storage
                .from(bucket)
                .upload(`${folderId}/originals/${filename}`, compressed),
            supabase.storage
                .from(bucket)
                .upload(`${folderId}/thumbs/${filename}`, thumb)
        ])

        if (origResult.error) throw new Error(`Error al subir original: ${origResult.error.message}`)
        if (thumbResult.error) throw new Error(`Error al subir miniatura: ${thumbResult.error.message}`)

        // Get Public URLs (synchronous typically, but Supabase JS might verify?) 
        // actually getPublicUrl is synchronous in v2
        const { data: { publicUrl: url } } = supabase.storage.from(bucket).getPublicUrl(`${folderId}/originals/${filename}`)
        const { data: { publicUrl: thumbUrl } } = supabase.storage.from(bucket).getPublicUrl(`${folderId}/thumbs/${filename}`)

        return {
            url,
            thumb_url: thumbUrl,
            size_bytes: compressed.size
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error al procesar imagen'
        console.error('Error processing image:', error)
        throw new Error(errorMessage)
    }
}

// Helper for batching promises
async function processInBatches<T, R>(items: T[], batchSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = []
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        const batchResults = await Promise.all(batch.map(fn))
        results.push(...batchResults)
    }
    return results
}

export async function uploadListingImages(files: File[], listingId: string) {
    const supabase = createClient()
    // Limit concurrency to 3 to prevent mobile crashes
    return processInBatches(files, 3, (file) => processAndUploadImage(file, 'listings', listingId, supabase))
}

export async function uploadFlatImages(files: File[], flatId: string) {
    const supabase = createClient()
    // Limit concurrency to 3 to prevent mobile crashes
    return processInBatches(files, 3, (file) => processAndUploadImage(file, 'flats', flatId, supabase))
}

export async function uploadPostImage(file: File, postId: string) {
    const supabase = createClient()

    try {
        const compressed = await compressImage(file)

        const ext = file.name.split('.').pop()
        const filename = `${uuidv4()}.${ext}`
        const bucketName = 'posts'

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(`${postId}/${filename}`, compressed)

        if (error) {
            throw new Error(`Error al subir imagen: ${error.message}`)
        }

        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(`${postId}/${filename}`)

        return publicUrl
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error al procesar imagen'
        console.error('Error processing post image:', error)
        throw new Error(errorMessage)
    }
}
