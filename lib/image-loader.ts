export default function supabaseLoader({
    src,
    width,
    quality,
}: {
    src: string
    width: number
    quality?: number
}) {
    // If it's a local static asset (e.g., /icon.png, /BLife.webp), return as is
    if (src.startsWith('/')) {
        return src
    }

    // Check if it's already a full URL (e.g. from Google Auth or external)
    if (src.startsWith('http')) {
        // For Supabase URLs, we can append transformation params
        // For other URLs, return as-is
        if (src.includes('supabase.co')) {
            return `${src}?width=${width}&q=${quality || 75}`
        }
        return src
    }

    // For relative paths (shouldn't happen in this codebase)
    return `${src}?width=${width}&q=${quality || 75}`
}
