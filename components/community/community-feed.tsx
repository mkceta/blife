'use client'

import { createClient } from '@/lib/supabase'
import { PostCard } from '@/components/community/post-card'
import { CommunitySkeleton } from '@/components/community/community-skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { fetchCommunityPostsAction, fetchUserReactionsAction } from '@/app/feed-actions'
import { PollCard } from './poll-card'

interface CommunityFeedProps {
    category?: string
    searchQuery?: string
    initialPosts?: any[]
    initialReactions?: string[]
    currentUserId?: string
}

export function CommunityFeed({
    category = 'General',
    searchQuery = '',
    initialPosts = [],
    initialReactions = [],
    currentUserId
}: CommunityFeedProps) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    // 1. Fetch Posts with React Query
    const { data: postsData, isLoading, isRefetching, refetch } = useQuery({
        // Include searchQuery in key to support deep server search if needed
        queryKey: ['community', category, searchQuery],
        queryFn: async () => {
            const data = await fetchCommunityPostsAction(category, searchQuery) // Pass searchQuery to server
            return data || []
        },
        initialData: initialPosts.length > 0 ? initialPosts : undefined,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // 2. Fetch User Reactions with React Query
    const { data: userReactionsSet } = useQuery({
        queryKey: ['community-reactions', currentUserId, category], // Simplify key
        queryFn: async () => {
            if (!currentUserId || !postsData || postsData.length === 0) return new Set<string>()

            const postIds = postsData.map((p: any) => p.id)
            const reactionIds = await fetchUserReactionsAction(postIds)
            return new Set(reactionIds as string[])
        },
        initialData: new Set(initialReactions),
        enabled: !!currentUserId && !!postsData && postsData.length > 0,
        staleTime: 0 // Force refetch on invalidation
    })

    // 3. Fetch Polls with React Query
    const { data: pollsData } = useQuery({
        queryKey: ['polls', category],
        queryFn: async () => {
            const { data } = await supabase
                .from('polls')
                .select(`
                    *,
                    user:users(alias_inst, avatar_url),
                    options:poll_options(*),
                    votes:poll_votes(option_id, user_id)
                `)
                .eq('category', category)
                .order('created_at', { ascending: false })

            return data || []
        },
        staleTime: 1000 * 60 * 5
    })

    // 3. Client-Side Filtering for Instant Search fallback
    // If the server action already processed searchQuery, this filter might be redundant but harmless.
    // However, fetchCommunityPostsAction does use the query.
    // So 'postsData' is already filtered.
    // We can just use postsData directly.

    // Wait, if we use Client Cache (staleTime), and I type in search bar...
    // The previous code had client filtering to avoid refetching on every keystroke.
    // If 'searchQuery' prop changes, useQuery refetches.
    // If the PARENT controls 'searchQuery' via URL, then each keystroke -> URL change -> Refetch.
    // That's standard.

    // Combine posts and polls, sort by created_at
    const combinedFeed = useMemo(() => {
        const posts = (postsData || []).map((p: any) => ({ ...p, type: 'post' }))
        const polls = (pollsData || []).map((p: any) => ({ ...p, type: 'poll' }))

        return [...posts, ...polls].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }, [postsData, pollsData])

    if (isLoading) {
        return <CommunitySkeleton />
    }

    return (
        <PullToRefresh onRefresh={async () => { await refetch() }}>
            <div className="space-y-4 min-h-[calc(100vh-10rem)]">
                {isRefetching && combinedFeed.length > 0 && (
                    <div className="flex justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {combinedFeed.map((item: any, index: number) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{
                                duration: 0.3,
                                delay: Math.min(index * 0.05, 0.4)
                            }}
                        >
                            {item.type === 'poll' ? (
                                <PollCard
                                    poll={item}
                                    options={item.options || []}
                                    userVotes={
                                        item.votes
                                            ?.filter((v: any) => v.user_id === currentUserId)
                                            .map((v: any) => v.option_id) || []
                                    }
                                    currentUserId={currentUserId}
                                />
                            ) : (
                                <PostCard
                                    post={item}
                                    currentUser={{ id: currentUserId }}
                                    hasUserReacted={userReactionsSet?.has(item.id) || false}
                                    priority={index < 5}
                                />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {combinedFeed.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 text-muted-foreground"
                    >
                        {searchQuery
                            ? `No se encontraron resultados para "${searchQuery}"`
                            : "No hay publicaciones todavía. ¡Sé el primero en publicar!"}
                    </motion.div>
                )}
            </div>
        </PullToRefresh>
    )
}
