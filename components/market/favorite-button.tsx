'use client'

import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

interface FavoriteButtonProps {
    listingId: string
    initialIsFavorite: boolean
    favoritesCount?: number
    variant?: 'outline' | 'default' | 'secondary'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    className?: string
    showCount?: boolean
}

export function FavoriteButton({
    listingId,
    initialIsFavorite,
    favoritesCount = 0,
    variant = 'outline',
    size = 'icon',
    className,
    showCount = true
}: FavoriteButtonProps) {
    const [isPending, startTransition] = useTransition()
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
    const [count, setCount] = useState(favoritesCount)
    const supabase = createClient()

    const handleToggle = async () => {
        const newState = !isFavorite
        setIsFavorite(newState)
        setCount(prev => newState ? prev + 1 : Math.max(0, prev - 1))

        startTransition(async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    toast.error('Debes iniciar sesión')
                    // Revert
                    setIsFavorite(!newState)
                    setCount(prev => !newState ? prev + 1 : Math.max(0, prev - 1))
                    return
                }

                if (newState) {
                    // Add to favorites
                    const { error } = await supabase
                        .from('favorites')
                        .insert({
                            listing_id: listingId,
                            user_id: user.id
                        })

                    if (error) throw error

                    await (supabase as any).rpc('increment_favorites', { listing_id: listingId }).catch(() => { })
                    toast.success('Añadido a favoritos')
                } else {
                    // Remove from favorites
                    const { error } = await supabase
                        .from('favorites')
                        .delete()
                        .eq('listing_id', listingId)
                        .eq('user_id', user.id)

                    if (error) throw error

                    await (supabase as any).rpc('decrement_favorites', { listing_id: listingId }).catch(() => { })
                    toast.success('Eliminado de favoritos')
                }
            } catch (error: any) {
                console.error('Error toggling favorite:', error)
                toast.error('Error al actualizar favoritos')
                // Revert
                setIsFavorite(!newState)
                setCount(prev => !newState ? prev + 1 : Math.max(0, prev - 1))
            }
        })
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleToggle}
            disabled={isPending}
            className={cn(
                "transition-all gap-2",
                isFavorite && "bg-primary/10 border-primary text-primary hover:bg-primary/20",
                className
            )}
        >
            <Heart
                className={cn(
                    "h-6 w-6 transition-all",
                    isFavorite && "fill-current"
                )}
            />
            {showCount && count > 0 && (
                <span className="text-sm font-medium">{count}</span>
            )}
        </Button>
    )
}
