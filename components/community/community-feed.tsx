'use client'

import { createClient } from '@/lib/supabase'
import { PostActions } from '@/components/community/post-actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/format'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useCallback } from 'react'

export function CommunityFeed() {
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [userReactions, setUserReactions] = useState<Set<string>>(new Set())
    const supabase = createClient()

    const fetchPosts = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        // Fetch posts with user data joined
        const { data: postsData, error } = await supabase
            .from('posts')
            .select(`
                *,
                user:users!posts_user_id_fkey(id, alias_inst, avatar_url)
            `)
            .eq('is_hidden', false)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) {
            console.error('Error fetching posts:', error)
            setLoading(false)
            return
        }

        setPosts(postsData || [])

        // Fetch user reactions if logged in
        if (user && postsData && postsData.length > 0) {
            const postIds = postsData.map(p => p.id)
            const { data: reactions } = await supabase
                .from('reactions')
                .select('post_id')
                .eq('user_id', user.id)
                .in('post_id', postIds)
            setUserReactions(new Set(reactions?.map(r => r.post_id) || []))
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        setLoading(true)
        fetchPosts()
    }, [fetchPosts])

    const handleRefresh = async () => {
        await fetchPosts()
    }

    if (loading) {
        return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="space-y-4 min-h-[calc(100vh-10rem)]">
                {posts.map((post, index) => {
                    const user = Array.isArray(post.user) ? post.user[0] : post.user
                    const displayName = `@${user?.alias_inst || 'Usuario'}`

                    return (
                        <div key={post.id} className="bg-card rounded-xl p-4 border border-border space-y-3">
                            <div className="flex items-start gap-3">
                                <Link href={`/user/profile?alias=${user?.alias_inst}`}>
                                    <Avatar className="h-10 w-10 border border-border cursor-pointer hover:opacity-80 transition-opacity">
                                        {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
                                        <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Link href={`/user/profile?alias=${user?.alias_inst}`} className="font-medium text-sm hover:text-primary transition-colors">
                                            {displayName}
                                        </Link>
                                        <span className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.text}</p>
                            {post.photo_url && (
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                    <Image
                                        src={post.photo_url}
                                        alt="Post image"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        priority={index < 2}
                                    />
                                </div>
                            )}
                            <PostActions
                                postId={post.id}
                                initialReactionsCount={post.reactions_count || 0}
                                initialCommentsCount={post.comments_count || 0}
                                hasUserReacted={userReactions.has(post.id)}
                                currentUserId={currentUser?.id}
                            />
                        </div>
                    )
                })}

                {posts.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">No hay publicaciones todavía. ¡Sé el primero en publicar!</div>
                )}
            </div>
        </PullToRefresh>
    )
}
