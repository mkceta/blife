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
import { CommunitySkeleton } from '@/components/community/community-skeleton'
import { motion } from 'framer-motion'

interface CommunityFeedProps {
    category?: string
    searchQuery?: string
    initialPosts?: any[]
    initialReactions?: string[] // Array of post IDs the user reacted to
    currentUserId?: string
}

export function CommunityFeed({
    category = 'General',
    searchQuery = '',
    initialPosts = [],
    initialReactions = [],
    currentUserId
}: CommunityFeedProps) {
    const [posts, setPosts] = useState<any[]>(initialPosts)
    const [loading, setLoading] = useState(initialPosts.length === 0)
    const [userReactions, setUserReactions] = useState<Set<string>>(new Set(initialReactions))
    const supabase = createClient()

    const fetchPosts = useCallback(async () => {
        // Only show loading if we really need to fetch (no existing posts) or if explicit refresh
        // But for "Refresh" action (PullToRefresh), we want to show the spinner from the PullToRefresh component, not full screen skeleton.
        // So we keep loading=false during refresh usually.

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

        if (searchQuery) {
            query = query.ilike('text', `%${searchQuery}%`)
        }

        const { data: postsData, error } = await query

        if (error) {
            console.error('Error fetching posts:', error)
            return
        }

        setPosts(postsData || [])

        // Fetch user reactions if logged in
        if (currentUserId && postsData && postsData.length > 0) {
            const postIds = postsData.map(p => p.id)
            const { data: reactions } = await supabase
                .from('reactions')
                .select('target_id')
                .eq('user_id', currentUserId)
                .eq('target_type', 'post')
                .in('target_id', postIds)
            setUserReactions(new Set(reactions?.map((r: any) => r.target_id) || []))
        }
    }, [supabase, category, searchQuery, currentUserId])

    // Fetch on mount ONLY if no initial data provided (Client-side fallback)
    useEffect(() => {
        if (initialPosts.length === 0) {
            fetchPosts().then(() => setLoading(false))
        }
    }, [fetchPosts, initialPosts])

    const handleRefresh = async () => {
        await fetchPosts()
        // We might want to re-check user auth or something? No, simple re-fetch matches current filter.
        // Note: PullToRefresh handles the UI loading state.
    }

    if (loading) {
        return <div className="pt-4"><CommunitySkeleton /></div>
    }

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="space-y-4 min-h-[calc(100vh-10rem)]">
                {posts.map((post, index) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
                    >
                        <PostCard
                            post={post}
                            currentUser={{ id: currentUserId }} // Pass minimal user obj
                            hasUserReacted={userReactions.has(post.id)}
                            priority={index < 2}
                        />
                    </motion.div>
                ))}

                {posts.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">No hay publicaciones todavía. ¡Sé el primero en publicar!</div>
                )}
            </div>
        </PullToRefresh>
    )
}
