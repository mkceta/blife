'use client'

import { createClient } from '@/lib/supabase'
import { PostActions } from '@/components/community/post-actions'
import { PostCard } from '@/components/community/post-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/format'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useCallback } from 'react'

interface CommunityFeedProps {
    category?: string
}

export function CommunityFeed({ category = 'General' }: CommunityFeedProps) {
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [userReactions, setUserReactions] = useState<Set<string>>(new Set())
    const supabase = createClient()

    const fetchPosts = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        // Fetch posts with user data joined
        let query = supabase
            .from('posts')
            .select(`
                *,
                user:users!posts_user_id_fkey(id, alias_inst, avatar_url)
            `)
            .eq('is_hidden', false)
            .order('created_at', { ascending: false })
            .limit(20)

        if (category && category !== 'Todos') {
            query = query.contains('category', [category])
        }

        const { data: postsData, error } = await query

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
                .select('target_id')
                .eq('user_id', user.id)
                .eq('target_type', 'post')
                .in('target_id', postIds)
            setUserReactions(new Set(reactions?.map((r: any) => r.target_id) || []))
        }
        setLoading(false)
    }, [supabase, category])

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
                {posts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        hasUserReacted={userReactions.has(post.id)}
                    />
                ))}

                {posts.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">No hay publicaciones todavía. ¡Sé el primero en publicar!</div>
                )}
            </div>
        </PullToRefresh>
    )
}
