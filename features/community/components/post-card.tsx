'use client'

import { PostActions } from '@/features/community/components/post-actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/format'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, MoreVertical, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState, memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { SimpleAlertDialog } from '@/components/shared/simple-alert-dialog'
import type { Post, User } from '@/lib/types'

interface PostCardProps {
    post: Post
    currentUser?: User | Pick<User, 'id'> | null
    hasUserReacted: boolean
    isDetail?: boolean
    priority?: boolean
}

export const PostCard = memo(function PostCard({ post, currentUser, hasUserReacted, isDetail = false, priority = false }: PostCardProps) {
    const user = Array.isArray(post.user) ? post.user[0] : post.user
    const displayName = `@${user?.alias_inst || 'anonimo'}`
    const router = useRouter()
    const queryClient = useQueryClient()
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    const handleDelete = useCallback(async () => {
        // Confirmation is handled by Dialog now
        setShowDeleteDialog(false)
        setIsDeleting(true)

        // Optimistic UI Update
        toast.success('Post eliminado')

        // 1. Snapshot previous state for rollback
        const previousData = queryClient.getQueriesData({ queryKey: ['community'] })

        // 2. Optimistically update all community lists
        // 2. Optimistically update all community lists (Infinite Query Support)
        queryClient.setQueriesData({ queryKey: ['community'] }, (oldData: InfiniteData<any> | undefined) => {
            if (!oldData) return oldData
            // Check if it's infinite data (has pages)
            if (oldData.pages && Array.isArray(oldData.pages)) {
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: Post[]) => page.filter((p) => p.id !== post.id))
                }
            }
            // Fallback for flat arrays (if used elsewhere)
            if (Array.isArray(oldData)) {
                return oldData.filter((p: Post) => p.id !== post.id)
            }
            return oldData
        })

        if (isDetail) {
            router.push('/community')
        }

        try {
            const { deletePostAction } = await import('@/app/community/actions')
            await deletePostAction(post.id)

            // Success - invalidate to ensure consistency eventually
            queryClient.invalidateQueries({ queryKey: ['community'] })
        } catch (error) {
            console.error(error)
            toast.error('Error al eliminar')
            setIsDeleting(false)

            // Rollback
            previousData.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data)
            })
        }
    }, [post.id, isDetail, router, queryClient])

    const isOwner = currentUser?.id === post.user_id

    return (
        <div className="bg-card rounded-xl p-4 border border-border space-y-3 relative">
            <div className="flex items-start gap-3">
                <Link href={`/user/${user?.alias_inst}`}>
                    <Avatar className="h-10 w-10 border border-border cursor-pointer hover:opacity-80 transition-opacity">
                        {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                        <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2">
                        <Link href={`/user/${user?.alias_inst}`} className="font-medium text-sm hover:text-primary transition-colors">
                            {displayName}
                        </Link>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</span>
                    </div>
                </div>

                {isOwner && (
                    <div className="absolute top-4 right-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onSelect={(e) => {
                                        e.preventDefault()
                                        setShowDeleteDialog(true)
                                    }}
                                    className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {/* If not detailed view, wrap text in Link to detail */}
            {!isDetail ? (
                <Link href={`/community/post/${post.id}`} className="block group">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed group-hover:text-foreground/90 transition-colors">{post.text}</p>
                    {post.category && post.category[0] && post.category[0] !== 'General' && (
                        <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                            {post.category[0]}
                        </span>
                    )}
                </Link>
            ) : (
                <>
                    <p className="text-lg md:text-xl font-medium whitespace-pre-wrap leading-relaxed text-foreground/90">{post.text}</p>
                    {post.category && post.category[0] && (
                        <div className="flex gap-2 mt-3">
                            {post.category.map((cat: string) => (
                                <span key={cat} className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                                    {cat}
                                </span>
                            ))}
                        </div>
                    )}
                </>
            )}

            {post.photo_url && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <Image
                        src={post.photo_url}
                        alt="Post image"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={priority}
                    />
                </div>
            )}

            <PostActions
                postId={post.id}
                initialReactionsCount={post.reactions_count || 0}
                initialCommentsCount={post.comments_count || 0}
                hasUserReacted={hasUserReacted}
                currentUserId={currentUser?.id}
                defaultShowComments={isDetail}
            />

            <SimpleAlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="¿Eliminar publicación?"
                description="Esta acción no se puede deshacer. ¿Seguro que quieres continuar?"
                confirmText="Eliminar"
                cancelText="Cancelar"
                isDestructive
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </div>
    )
})
