'use client'

import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ShareButtonProps {
    url: string
    title: string
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    className?: string
    children?: React.ReactNode
}

export function ShareButton({ url, title, variant = 'secondary', size = 'icon', className, children }: ShareButtonProps) {
    const handleShare = async () => {
        const shareData = {
            title: `BLife - ${title}`,
            text: `Mira esto en BLife: ${title}`,
            url: url
        }

        try {
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData)
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(url)
                toast.success('Enlace copiado al portapapeles')
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error)
                toast.error('Error al compartir')
            }
        }
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleShare}
            className={className}
        >
            {children || <Share2 className="h-5 w-5" />}
        </Button>
    )
}
