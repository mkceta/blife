
'use client'

import { PostActions } from '@/components/community/post-actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/format'
import Link from 'next/link'
import Image from 'next/image'

interface PostCardProps {
    post: any
    currentUser?: any
    hasUserReacted: boolean
    isDetail?: boolean
}

export function PostCard({ post, currentUser, hasUserReacted, isDetail = false }: PostCardProps) {
    const user = Array.isArray(post.user) ? post.user[0] : post.user
    const displayName = `@${user?.alias_inst || 'Usuario'}`

    return (
        <div className="bg-card rounded-xl p-4 border border-border space-y-3">
            <div className="flex items-start gap-3">
                <Link href={`/user/${user?.alias_inst}`}>
                    <Avatar className="h-10 w-10 border border-border cursor-pointer hover:opacity-80 transition-opacity">
                        {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                        <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <Link href={`/user/${user?.alias_inst}`} className="font-medium text-sm hover:text-primary transition-colors">
                            {displayName}
                        </Link>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</span>
                    </div>
                </div>
            </div>

            {/* If not detailed view, wrap text in Link to detail */}
            {!isDetail ? (
                <Link href={`/community/post/${post.id}`} className="block group">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed group-hover:text-foreground/90 transition-colors">{post.text}</p>
                </Link>
            ) : (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.text}</p>
            )}

            {post.photo_url && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <Image
                        src={post.photo_url}
                        alt="Post image"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
        </div>
    )
}
