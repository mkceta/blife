export default function supabaseLoader({
    src,
    width,
    quality,
}: {
    src: string
    width: number
    quality?: number
}) {
    if (src.startsWith('https://')) { // Already absolute (e.g. external or already processed)
        // If it's a supabase storage url, we can still optimize it
        if (src.includes('supabase.co/storage/v1/object/public')) {
            // ... transform logic if needed, but usually Supabase transform is separate
            // Supabase Image transformation URL pattern: 
            // /render/image/public/[bucket]/[key]?width=...
            // But the standard storage URL is /storage/v1/object/public/...
            // To use Supabase Image Transformation (if enabled on project):
            // https://[project].supabase.co/storage/v1/render/image/public/[bucket]/[key]...

            // For now, let's just assume we return the src because optimizing external absolute URLs 
            // requires a proxy or specific support. 
            // If the user wants "Optimized Images" and we are static, we rely on the CDN.
            // If the URL is from Supabase, we can append transformation params IF the bucket is public and transforms are on.
            return `${src}?width=${width}&quality=${quality || 75}`
        }
        return src
    }
    // Local assets in public folder
    return `/${src}`
}
