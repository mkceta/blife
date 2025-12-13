
'use client'

import { PostActions } from '@/components/community/post-actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/format'
import Link from 'next/link'
import Image from 'next/image'

import { Trash2, MoreVertical, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion } from 'framer-motion'
import { SPRING, fadeInUp } from '@/lib/animations'

interface PostCardProps {
    post: any
    currentUser?: any
    hasUserReacted: boolean
    isDetail?: boolean
    priority?: boolean
}

export function PostCard({ post, currentUser, hasUserReacted, isDetail = false, priority = false }: PostCardProps) {
    const user = Array.isArray(post.user) ? post.user[0] : post.user
    const displayName = `@${user?.alias_inst || 'Usuario'}`
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm('¿Seguro que quieres borrar este post?')) return

        setIsDeleting(true)
        try {
            const { deletePostAction } = await import('@/app/community/actions')
            await deletePostAction(post.id)

            toast.success('Post eliminado')
            if (isDetail) {
                router.push('/community')
            }
            // No need to router.refresh() if revalidatePath worked, but no harm keeping it if needed, 
            // though server action revalidation should be enough.
        } catch (error) {
            console.error(error)
            toast.error('Error al eliminar')
            setIsDeleting(false)
        }
    }

    const isOwner = currentUser?.id === post.user_id

    return (
        <motion.div
            className="bg-card rounded-xl p-4 border border-border space-y-3 relative"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
            <div className="flex items-start gap-3">
                <Link href={`/user/${user?.alias_inst}`}>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={SPRING.snappy}
                    >
                        <Avatar className="h-10 w-10 border border-border cursor-pointer">
                            {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                            <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </motion.div>
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
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                                    {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
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
                        <motion.span
                            className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {post.category[0]}
                        </motion.span>
                    )}
                </Link>
            ) : (
                <>
                    <p className="text-lg md:text-xl font-medium whitespace-pre-wrap leading-relaxed text-foreground/90">{post.text}</p>
                    {post.category && post.category[0] && (
                        <div className="flex gap-2 mt-3">
                            {post.category.map((cat: string, index: number) => (
                                <motion.span
                                    key={cat}
                                    className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    {cat}
                                </motion.span>
                            ))}
                        </div>
                    )}
                </>
            )}

            {post.photo_url && (
                <motion.div
                    className="relative aspect-video rounded-lg overflow-hidden bg-muted"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                >
                    <Image
                        src={post.photo_url}
                        alt="Post image"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={priority}
                    />
                </motion.div>
            )}

            <PostActions
                postId={post.id}
                initialReactionsCount={post.reactions_count || 0}
                initialCommentsCount={post.comments_count || 0}
                hasUserReacted={hasUserReacted}
                currentUserId={currentUser?.id}
                defaultShowComments={isDetail}
            />
        </motion.div>
    )
}
