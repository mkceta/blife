'use client'

import { createClient } from '@/lib/supabase'
import { PostCard } from '@/components/community/post-card'
import { CommunitySkeleton } from '@/components/community/community-skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { fetchCommunityPostsAction, fetchUserReactionsAction } from '@/app/feed-actions'
import { PollCard } from './poll-card'

interface CommunityFeedProps {
    category?: string
    searchQuery?: string
    initialPosts?: any[]
    initialPolls?: any[]
    initialReactions?: string[]
    currentUserId?: string
}

export function CommunityFeed({
    category = 'General',
    searchQuery = '',
    initialPosts = [],
    initialPolls = [],
    initialReactions = [],
    currentUserId
}: CommunityFeedProps) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    // 1. Fetch Posts with React Query
    const { data: postsData, isPending, isRefetching, refetch } = useQuery({
        queryKey: ['community', category, searchQuery],
        queryFn: async () => {
            const data = await fetchCommunityPostsAction(category, searchQuery)
            return data || []
        },
        initialData: initialPosts.length > 0 ? initialPosts : undefined,
        initialDataUpdatedAt: initialPosts.length > 0 ? Date.now() : undefined, // Mark as fresh
        staleTime: 1000 * 60 * 10, // 10 minutes
        gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
        placeholderData: (previousData) => previousData, // Keep old data while refetching
    })

    // 2. Fetch Polls in parallel (not dependent on posts)
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
        initialData: initialPolls.length > 0 ? initialPolls : undefined,
        initialDataUpdatedAt: initialPolls.length > 0 ? Date.now() : undefined,
        staleTime: 1000 * 60 * 10, // 10 minutes
        gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
        placeholderData: (previousData) => previousData, // Keep old data while refetching
    })

    // 3. Fetch User Reactions in parallel (use initialData to avoid waiting)
    const { data: userReactionsSet } = useQuery({
        queryKey: ['community-reactions', currentUserId],
        queryFn: async () => {
            if (!currentUserId) return new Set<string>()

            // Fetch ALL user reactions at once (not filtered by visible posts)
            const { data } = await supabase
                .from('reactions')
                .select('post_id')
                .eq('user_id', currentUserId)

            return new Set(data?.map(r => r.post_id) || [])
        },
        initialData: new Set(initialReactions),
        enabled: !!currentUserId,
        staleTime: 1000 * 60 * 2, // 2 minutes
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

    // Show skeleton only on absolute first load (isPending = no data at all)
    if (isPending) return <CommunitySkeleton />

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
                                delay: Math.min(index * 0.01, 0.1)
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
