'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { lightHaptic } from '@/lib/haptics'

interface OptimisticFavoriteParams {
    listingId: string
    userId: string
    currentlyFavorited: boolean
}

/**
 * Hook para toggle optimista de favoritos
 * Actualiza la UI inmediatamente y hace rollback si falla
 */
export function useOptimisticFavorite() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({ listingId, userId, currentlyFavorited }: OptimisticFavoriteParams) => {
            if (currentlyFavorited) {
                // Remove favorite
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('listing_id', listingId)
                    .eq('user_id', userId)

                if (error) throw error
                return { action: 'removed' as const, listingId }
            } else {
                // Add favorite
                const { error } = await supabase
                    .from('favorites')
                    .insert({ listing_id: listingId, user_id: userId })

                if (error) throw error
                return { action: 'added' as const, listingId }
            }
        },
        onMutate: async ({ listingId, userId, currentlyFavorited }) => {
            // Haptic feedback inmediato
            lightHaptic()

            // Cancelar queries en curso
            await queryClient.cancelQueries({ queryKey: ['favorites', userId] })

            // Snapshot del estado anterior
            const previousFavorites = queryClient.getQueryData<string[]>(['favorites', userId])

            // Actualización optimista
            queryClient.setQueryData<string[]>(['favorites', userId], (old = []) => {
                if (currentlyFavorited) {
                    return old.filter(id => id !== listingId)
                } else {
                    return [...old, listingId]
                }
            })

            return { previousFavorites }
        },
        onError: (error, { userId }, context) => {
            // Rollback en caso de error
            if (context?.previousFavorites) {
                queryClient.setQueryData(['favorites', userId], context.previousFavorites)
            }
            toast.error('Error al actualizar favoritos')
            console.error('Error toggling favorite:', error)
        },
        onSuccess: (data) => {
            // Opcional: mostrar toast de confirmación
            // toast.success(data.action === 'added' ? 'Añadido a favoritos' : 'Eliminado de favoritos')
        },
        onSettled: (data, error, { userId }) => {
            // Invalidar queries relacionadas para refetch en background
            queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
        },
    })
}
