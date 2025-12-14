/**
 * Utilidades para optimización de imágenes con Supabase Storage
 */

const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public'

export interface ImageTransformOptions {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpeg' | 'png'
    resize?: 'cover' | 'contain' | 'fill'
}

/**
 * Genera URL de imagen con transformaciones de Supabase
 */
export function getOptimizedImageUrl(
    bucket: string,
    path: string,
    options: ImageTransformOptions = {}
): string {
    const {
        width,
        height,
        quality = 80,
        format = 'webp',
        resize = 'cover'
    } = options

    const baseUrl = `${SUPABASE_STORAGE_URL}/${bucket}/${path}`

    // Si no hay transformaciones, devolver URL original
    if (!width && !height) {
        return baseUrl
    }

    const params = new URLSearchParams()

    if (width) params.append('width', width.toString())
    if (height) params.append('height', height.toString())
    params.append('quality', quality.toString())
    params.append('format', format)
    params.append('resize', resize)

    return `${baseUrl}?${params.toString()}`
}

/**
 * Genera srcset para imágenes responsive
 */
export function generateSrcSet(
    bucket: string,
    path: string,
    widths: number[] = [320, 640, 960, 1280, 1920]
): string {
    return widths
        .map(width => {
            const url = getOptimizedImageUrl(bucket, path, { width, quality: 80 })
            return `${url} ${width}w`
        })
        .join(', ')
}

/**
 * Genera blur placeholder data URL
 */
export function generateBlurDataURL(width = 10, height = 10): string {
    // Crear un SVG simple como placeholder
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${width}" height="${height}" fill="#e5e7eb"/>
        </svg>
    `
    const base64 = Buffer.from(svg).toString('base64')
    return `data:image/svg+xml;base64,${base64}`
}

/**
 * Extrae bucket y path de una URL de Supabase Storage
 */
export function parseSupabaseStorageUrl(url: string): { bucket: string; path: string } | null {
    try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/').filter(Boolean)

        // Formato: /storage/v1/object/public/{bucket}/{path}
        if (pathParts[0] === 'storage' && pathParts[1] === 'v1' && pathParts[2] === 'object' && pathParts[3] === 'public') {
            const bucket = pathParts[4]
            const path = pathParts.slice(5).join('/')
            return { bucket, path }
        }

        return null
    } catch {
        return null
    }
}

/**
 * Tamaños responsive predefinidos para diferentes casos de uso
 */
export const IMAGE_SIZES = {
    // Cards de productos (2 columnas en mobile, 5 en desktop)
    productCard: {
        mobile: 180,
        tablet: 240,
        desktop: 280,
    },
    // Imágenes de perfil
    avatar: {
        small: 40,
        medium: 64,
        large: 128,
    },
    // Imágenes de posts
    postImage: {
        mobile: 360,
        tablet: 600,
        desktop: 800,
    },
    // Imágenes a pantalla completa
    fullscreen: {
        mobile: 640,
        tablet: 1024,
        desktop: 1920,
    },
} as const
