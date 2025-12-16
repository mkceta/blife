'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { lightHaptic } from '@/lib/haptics'
import type { Post } from '@/lib/types'

interface OptimisticReactionParams {
    postId: string
    userId: string
    currentlyReacted: boolean
}

/**
 * Hook para toggle optimista de reacciones en posts
 * Actualiza la UI inmediatamente y hace rollback si falla
 */
export function useOptimisticReaction() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({ postId, userId, currentlyReacted }: OptimisticReactionParams) => {
            if (currentlyReacted) {
                // Remove reaction
                const { error } = await supabase
                    .from('post_reactions')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', userId)

                if (error) throw error

                // Decrementar contador
                const { error: updateError } = await supabase.rpc('decrement_reactions', {
                    post_id: postId,
                })
                if (updateError) console.error('Error decrementing reactions:', updateError)

                return { action: 'removed' as const, postId }
            } else {
                // Add reaction
                const { error } = await supabase
                    .from('post_reactions')
                    .insert({ post_id: postId, user_id: userId })

                if (error) throw error

                // Incrementar contador
                const { error: updateError } = await supabase.rpc('increment_reactions', {
                    post_id: postId,
                })
                if (updateError) console.error('Error incrementing reactions:', updateError)

                return { action: 'added' as const, postId }
            }
        },
        onMutate: async ({ postId, userId, currentlyReacted }) => {
            // Haptic feedback inmediato
            lightHaptic()

            // Cancelar queries en curso
            await queryClient.cancelQueries({ queryKey: ['community-reactions', userId] })

            // Snapshot del estado anterior
            const previousReactions = queryClient.getQueryData<Set<string>>(['community-reactions', userId])

            // Actualización optimista del Set de reacciones
            queryClient.setQueryData<Set<string>>(['community-reactions', userId], (old = new Set()) => {
                const newSet = new Set(old)
                if (currentlyReacted) {
                    newSet.delete(postId)
                } else {
                    newSet.add(postId)
                }
                return newSet
            })

            // También actualizar el contador en el post si está en cache
            const category = queryClient.getQueryData<string>(['current-category'])
            if (category) {
                queryClient.setQueryData<Post[]>(['community', category, ''], (old: Post[] = []) => {
                    return old.map((post: Post) => {
                        if (post.id === postId) {
                            return {
                                ...post,
                                reactions_count: currentlyReacted
                                    ? (post.reactions_count || 1) - 1
                                    : (post.reactions_count || 0) + 1
                            }
                        }
                        return post
                    })
                })
            }

            return { previousReactions }
        },
        onError: (error, { userId, postId }, context) => {
            // Rollback en caso de error
            if (context?.previousReactions) {
                queryClient.setQueryData(['community-reactions', userId], context.previousReactions)
            }
            toast.error('Error al reaccionar')
            console.error('Error toggling reaction:', error)
        },
        onSettled: (data, error, { userId }) => {
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: ['community-reactions', userId] })
            queryClient.invalidateQueries({ queryKey: ['community'] })
        },
    })
}

