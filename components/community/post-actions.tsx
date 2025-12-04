'use client'

import { Heart, MessageCircle, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface PostActionsProps {
    postId: string
    initialReactionsCount: number
    initialCommentsCount: number
    hasUserReacted: boolean
    currentUserId?: string
}

export function PostActions({
    postId,
    initialReactionsCount,
    initialCommentsCount,
    hasUserReacted,
    currentUserId
}: PostActionsProps) {
    const [isPending, startTransition] = useTransition()
    const [showComments, setShowComments] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [reactionsCount, setReactionsCount] = useState(initialReactionsCount)
    const [commentsCount, setCommentsCount] = useState(initialCommentsCount)
    const [userReacted, setUserReacted] = useState(hasUserReacted)
    const [comments, setComments] = useState<Comment[]>([])
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [hasLoadedComments, setHasLoadedComments] = useState(false)
    const supabase = createClient()

    const handleToggleComments = async () => {
        const newShowComments = !showComments
        setShowComments(newShowComments)

        if (newShowComments && !hasLoadedComments) {
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
    }

    const handleReaction = async () => {
        if (!currentUserId) {
            toast.error('Debes iniciar sesión')
            return
        }

        const newReacted = !userReacted
        setUserReacted(newReacted)
        setReactionsCount(prev => newReacted ? prev + 1 : prev - 1)

        try {
            if (userReacted) {
                // Remove reaction
                const { error } = await supabase
                    .from('reactions')
                    .delete()
                    .eq('target_id', postId)
                    .eq('target_type', 'post')
                    .eq('user_id', currentUserId)

                if (error) throw error

                // Try to call RPC if exists, otherwise ignore (trigger might handle it)
                await (supabase as any).rpc('decrement_reactions', { post_id: postId }).catch(() => { })
            } else {
                // Add reaction
                const { error } = await supabase
                    .from('reactions')
                    .insert({
                        target_id: postId,
                        target_type: 'post',
                        user_id: currentUserId,
                        emoji: '❤️'
                    })

                if (error) throw error

                await (supabase as any).rpc('increment_reactions', { post_id: postId }).catch(() => { })
            }
        } catch (error: any) {
            console.error('Error toggling reaction:', error)
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
            id: Math.random().toString(), // Temporary ID
            text: text,
            created_at: new Date().toISOString(),
            user_id: currentUserId,
            user: {
                id: currentUserId,
                alias_inst: 'Tú', // Placeholder
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

            toast.success('Comentario añadido')

            // Refresh comments to get real ID and user info
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

        } catch (error: any) {
            console.error('Error adding comment:', error)
            toast.error('Error al añadir comentario')
            setCommentsCount(prev => prev - 1)
            setComments(prev => prev.filter(c => c.id !== newComment.id))
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-4 pt-2 text-muted-foreground">
                <button
                    onClick={handleReaction}
                    disabled={isPending}
                    className={`flex items-center gap-1 text-sm hover:text-primary transition-colors ${userReacted ? 'text-red-500' : ''}`}
                >
                    <Heart className={`h-4 w-4 ${userReacted ? 'fill-current' : ''}`} />
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
                        <PostComments comments={comments} currentUserId={currentUserId} />
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
}

export function PostComments({ comments, currentUserId }: PostCommentsProps) {
    const supabase = createClient()
    const [isPending, startTransition] = useTransition()

    const handleDeleteComment = async (commentId: string) => {
        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId)

            if (error) throw error
            toast.success('Comentario eliminado')
            // Ideally we should update the parent state, but for now this is okay
        } catch (error) {
            console.error('Error deleting comment:', error)
            toast.error('Error al eliminar comentario')
        }
    }

    if (comments.length === 0) return null

    return (
        <div className="space-y-2 pt-2 border-t border-border">
            {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 text-sm">
                    <Link href={`/user/@${comment.user.alias_inst}`}>
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
                                href={`/user/@${comment.user.alias_inst}`}
                                className="font-medium text-xs hover:text-primary"
                            >
                                @{comment.user.alias_inst}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), { locale: es, addSuffix: true })}
                            </span>
                            {currentUserId === comment.user_id && (
                                <button
                                    onClick={() => handleDeleteComment(comment.id)}
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
