'use client'

import { Heart, MessageCircle, Trash2 } from 'lucide-react'
import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { likeHaptic, unlikeHaptic, sendHaptic } from '@/lib/haptics'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'

interface PostActionsProps {
    postId: string
    initialReactionsCount: number
    initialCommentsCount: number
    hasUserReacted: boolean
    currentUserId?: string
    defaultShowComments?: boolean
}

const Particle = ({ angle }: { angle: number }) => {
    const distance = 25 + Math.random() * 15
    const size = 2 + Math.random() * 2

    return (
        <motion.div
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
                x: Math.cos(angle * (Math.PI / 180)) * distance,
                y: Math.sin(angle * (Math.PI / 180)) * distance,
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0]
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute rounded-full z-50"
            style={{
                width: size,
                height: size,
                backgroundColor: ['#FF4D4D', '#FF8585', '#FFD700', '#4D96FF', '#6AC5FE', '#9b51e0', '#2ecc71'][Math.floor(Math.random() * 7)],
                left: '50%',
                top: '50%',
                marginLeft: -size / 2,
                marginTop: -size / 2,
            }}
        />
    )
}

export function PostActions({
    postId,
    initialReactionsCount,
    initialCommentsCount,
    hasUserReacted,
    currentUserId,
    defaultShowComments = false
}: PostActionsProps) {
    const [isPending, startTransition] = useTransition()
    const [showComments, setShowComments] = useState(defaultShowComments)
    const [commentText, setCommentText] = useState('')
    const [reactionsCount, setReactionsCount] = useState(initialReactionsCount)
    const [commentsCount, setCommentsCount] = useState(initialCommentsCount)
    const [userReacted, setUserReacted] = useState(hasUserReacted)

    console.log('PostActions render:', { postId, hasUserReacted, userReacted, initialReactionsCount })
    const [comments, setComments] = useState<Comment[]>([])
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [hasLoadedComments, setHasLoadedComments] = useState(false)
    const [showParticles, setShowParticles] = useState(false)
    const controls = useAnimation()
    const supabase = createClient()
    const queryClient = useQueryClient()

    // Particles config
    const particleCount = 20
    const angles = Array.from({ length: particleCount }).map((_, i) => (360 / particleCount) * i)

    useEffect(() => {
        if (showParticles) {
            const timer = setTimeout(() => setShowParticles(false), 800)
            return () => clearTimeout(timer)
        }
        return undefined
    }, [showParticles])

    // Sync local state with prop when it changes (e.g., after query invalidation)
    useEffect(() => {
        setUserReacted(hasUserReacted)
    }, [hasUserReacted])

    // Sync reactions count with initial value when it changes
    useEffect(() => {
        setReactionsCount(initialReactionsCount)
    }, [initialReactionsCount])

    // Subscribe to realtime updates for this post's reactions_count
    useEffect(() => {
        const channel = supabase
            .channel(`post-${postId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'posts',
                    filter: `id=eq.${postId}`
                },
                (payload: { new: { reactions_count?: number } }) => {
                    if (payload.new && typeof payload.new.reactions_count === 'number') {
                        setReactionsCount(payload.new.reactions_count)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [postId, supabase])

    useEffect(() => {
        if (defaultShowComments && !hasLoadedComments) {
            loadComments()
        }
    }, [defaultShowComments])

    const loadComments = async () => {
        if (hasLoadedComments) return

        setIsLoadingComments(true)
        try {
            const { data: commentsData, error } = await supabase
                .from('comments')
                .select(`
                    id,
                    text,
                    created_at,
                    user_id,
                    post_id,
                    user:users!comments_user_id_fkey(id, alias_inst, avatar_url)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true })

            if (error) throw error
            setComments(commentsData as any)
            setHasLoadedComments(true)
        } catch (error) {
            console.error('Error fetching comments:', error)
            toast.error('Error al cargar comentarios')
        } finally {
            setIsLoadingComments(false)
        }
    }

    const handleToggleComments = () => {
        const newShowComments = !showComments
        setShowComments(newShowComments)
        if (newShowComments) {
            loadComments()
        }
    }

    const handleReaction = async () => {
        if (!currentUserId) {
            toast.error('Debes iniciar sesión')
            return
        }

        const newReacted = !userReacted

        // Animation & Haptics
        if (newReacted) {
            likeHaptic()
            setShowParticles(true)
            controls.start({
                scale: [1, 0.8, 1.4, 0.9, 1],
                transition: { duration: 0.5, ease: "easeOut" }
            })
        } else {
            unlikeHaptic()
            controls.start({
                scale: [1, 0.8, 1],
                transition: { duration: 0.2 }
            })
        }

        setUserReacted(newReacted)
        setReactionsCount(prev => newReacted ? prev + 1 : prev - 1)

        try {
            if (newReacted) {
                // User wants to ADD reaction
                const { error } = await supabase
                    .from('reactions')
                    .insert({
                        post_id: postId,
                        user_id: currentUserId,
                        emoji: '❤️'
                    })

                if (error) {
                    if (error.code === '23505') {
                        // Already exists, just sync state
                        return
                    }
                    throw error
                }

                await supabase.rpc('increment_reactions', { post_id: postId })

            } else {
                // User wants to REMOVE reaction
                const { error } = await supabase
                    .from('reactions')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', currentUserId)

                if (error) throw error

                await supabase.rpc('decrement_reactions', { post_id: postId })
            }

            // Invalidate queries to sync across app
            await queryClient.invalidateQueries({ queryKey: ['community-reactions'] })
            await queryClient.invalidateQueries({ queryKey: ['community'] })
        } catch (error: unknown) {
            console.error('Error toggling reaction:', JSON.stringify(error, null, 2))
            toast.error('Error al reaccionar')
            // Revert on error
            setUserReacted(!newReacted)
            setReactionsCount(prev => newReacted ? prev - 1 : prev + 1)
        }
    }

    const handleAddComment = async () => {
        if (!currentUserId) {
            toast.error('Debes iniciar sesión')
            return
        }

        if (!commentText.trim()) {
            toast.error('El comentario no puede estar vacío')
            return
        }

        const text = commentText
        setCommentText('')
        setCommentsCount(prev => prev + 1)

        // Optimistic update
        const newComment: Comment = {
            id: Math.random().toString(),
            text: text,
            created_at: new Date().toISOString(),
            user_id: currentUserId,
            user: {
                id: currentUserId,
                alias_inst: 'Tú',
                avatar_url: null
            }
        }
        setComments(prev => [...prev, newComment])

        try {
            const { error } = await supabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: currentUserId,
                    text: text.trim()
                })

            if (error) throw error

            sendHaptic()
            toast.success('Comentario añadido')

            const { data: commentsData } = await supabase
                .from('comments')
                .select(`
                    id,
                    text,
                    created_at,
                    user_id,
                    post_id,
                    user:users!comments_user_id_fkey(id, alias_inst, avatar_url)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true })

            if (commentsData) {
                setComments(commentsData as any)
            }

        } catch (error: unknown) {
            console.error('Error adding comment:', error)
            toast.error('Error al añadir comentario')
            setCommentsCount(prev => prev - 1)
            setComments(prev => prev.filter(c => c.id !== newComment.id))
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        const previousComments = comments
        const previousCount = commentsCount

        setComments(prev => prev.filter(c => c.id !== commentId))
        setCommentsCount(prev => prev - 1)
        toast.success('Comentario eliminado')

        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId)

            if (error) throw error
        } catch (error) {
            console.error('Error deleting comment:', error)
            toast.error('Error al eliminar comentario')
            setComments(previousComments)
            setCommentsCount(previousCount)
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-4 pt-2 text-muted-foreground">
                <button
                    onClick={handleReaction}
                    disabled={isPending}
                    className={cn(
                        "group flex items-center gap-1 text-sm hover:text-primary transition-colors focus:outline-none",
                        userReacted ? 'text-red-500' : ''
                    )}
                >
                    <div className="relative flex items-center justify-center">
                        <AnimatePresence>
                            {showParticles && angles.map((angle, i) => (
                                <Particle key={i} angle={angle} />
                            ))}
                        </AnimatePresence>

                        <motion.div animate={controls}>
                            <Heart className={cn(
                                "h-4 w-4 transition-colors",
                                userReacted ? 'fill-current' : ''
                            )} />
                        </motion.div>
                    </div>
                    <span>{reactionsCount}</span>
                </button>
                <button
                    onClick={handleToggleComments}
                    className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                >
                    <MessageCircle className="h-4 w-4" />
                    <span>{commentsCount}</span>
                </button>
            </div>

            {showComments && (
                <div className="space-y-3 pt-2 border-t border-border animate-in slide-in-from-top-2 duration-200">
                    {currentUserId && (
                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Escribe un comentario..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="min-h-[60px] text-sm"
                            />
                            <Button
                                onClick={handleAddComment}
                                disabled={isPending || !commentText.trim()}
                                size="sm"
                            >
                                Enviar
                            </Button>
                        </div>
                    )}

                    {isLoadingComments ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            Cargando comentarios...
                        </div>
                    ) : (
                        <PostComments
                            comments={comments}
                            currentUserId={currentUserId}
                            onDeleteComment={handleDeleteComment}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

interface Comment {
    id: string
    text: string
    created_at: string
    user_id: string
    user: {
        id: string
        alias_inst: string
        avatar_url: string | null
    }
}

interface PostCommentsProps {
    comments: Comment[]
    currentUserId?: string
    onDeleteComment: (id: string) => void
}

export function PostComments({ comments, currentUserId, onDeleteComment }: PostCommentsProps) {
    const [isPending, startTransition] = useTransition()

    if (comments.length === 0) return null

    return (
        <div className="space-y-2 pt-2 border-t border-border">
            {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 text-sm">
                    <Link href={`/user/${comment.user.alias_inst}`}>
                        <Avatar className="h-6 w-6 cursor-pointer hover:opacity-80">
                            <AvatarImage src={comment.user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                                {comment.user.alias_inst?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0 bg-muted rounded-lg p-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                href={`/user/${comment.user.alias_inst}`}
                                className="font-medium text-xs hover:text-primary"
                            >
                                @{comment.user.alias_inst}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), { locale: es, addSuffix: true })}
                            </span>
                            {currentUserId === comment.user_id && (
                                <button
                                    onClick={() => onDeleteComment(comment.id)}
                                    disabled={isPending}
                                    className="ml-auto text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs leading-relaxed">{comment.text}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

