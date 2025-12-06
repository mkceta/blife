'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

interface WishlistButtonProps {
    listingId: string
    isFavorited: boolean
    favoritesCount?: number
    currentUserId?: string
    variant?: 'default' | 'icon'
    className?: string
}

export function WishlistButton({
    listingId,
    isFavorited: initialFavorited,
    favoritesCount = 0,
    currentUserId,
    variant = 'icon',
    className
}: WishlistButtonProps) {
    const [isFavorited, setIsFavorited] = useState(initialFavorited)
    const [count, setCount] = useState(favoritesCount)
    const [isPending, startTransition] = useTransition()
    const supabase = createClient()

    const handleToggle = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (!currentUserId) {
            toast.error('Inicia sesión para añadir a favoritos')
            return
        }

        // Optimistic update
        const newState = !isFavorited
        setIsFavorited(newState)
        setCount(prev => newState ? prev + 1 : Math.max(0, prev - 1))

        startTransition(async () => {
            try {
                if (newState) {
                    // Add to favorites
                    const { error } = await supabase
                        .from('favorites')
                        .insert({
                            user_id: currentUserId,
                            listing_id: listingId
                        })
                    if (error) throw error
                    await (supabase as any).rpc('increment_favorites', { listing_id: listingId })
                } else {
                    // Remove from favorites
                    const { error } = await supabase
                        .from('favorites')
                        .delete()
                        .eq('user_id', currentUserId)
                        .eq('listing_id', listingId)
                    if (error) throw error
                    await (supabase as any).rpc('decrement_favorites', { listing_id: listingId })
                }
            } catch (error: any) {
                console.error('Error toggling favorite:', error)
                toast.error(error.message || 'Error al actualizar favoritos')
                // Revert on error
                setIsFavorited(!newState)
                setCount(prev => !newState ? prev + 1 : Math.max(0, prev - 1))
            }
        })
    }

    if (!currentUserId) return null

    if (variant === 'icon') {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                disabled={isPending}
                className={cn(
                    "h-10 rounded-full glass-strong border transition-all duration-300 group backdrop-blur-md flex items-center justify-center gap-1.5",
                    count > 0 ? "w-auto px-3" : "w-10",
                    isFavorited
                        ? "bg-primary/20 hover:bg-primary/30 border-primary/50 shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60"
                        : "bg-black/40 hover:bg-black/60 text-white border-white/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/30",
                    isPending && "animate-pulse-slow",
                    className
                )}
                aria-label={isFavorited ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
                <Heart
                    className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isFavorited && "fill-primary text-primary scale-110 drop-shadow-md",
                        !isFavorited && "text-white group-hover:scale-125 group-hover:text-primary"
                    )}
                />
                {count > 0 && (
                    <span className={cn(
                        "text-xs font-bold transition-colors",
                        isFavorited ? "text-primary" : "text-white group-hover:text-primary"
                    )}>
                        {count}
                    </span>
                )}
            </Button>
        )
    }

    return (
        <Button
            variant={isFavorited ? "default" : "outline"}
            onClick={handleToggle}
            disabled={isPending}
            className={cn(
                "transition-all duration-300",
                isFavorited && "bg-gradient-primary shadow-glow-primary",
                className
            )}
        >
            <Heart className={cn("h-4 w-4 mr-2 transition-all", isFavorited && "fill-current")} />
            {isFavorited ? 'En Wishlist' : 'Añadir a Wishlist'}
        </Button>
    )
}
