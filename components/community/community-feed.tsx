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
            // Call server action for reactions
            const reactionIds = await fetchUserReactionsAction(postIds)
            return new Set(reactionIds as string[])
        },
        initialData: new Set(initialReactions),
        enabled: !!currentUserId && !!postsData && postsData.length > 0,
        staleTime: 1000 * 60 * 5 // 5 mins
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

    const filteredPosts = postsData || []

    if (isLoading) {
        return <CommunitySkeleton />
    }

    return (
        <PullToRefresh onRefresh={async () => { await refetch() }}>
            <div className="space-y-4 min-h-[calc(100vh-10rem)]">
                {isRefetching && filteredPosts.length > 0 && (
                    <div className="flex justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {filteredPosts.map((post: any, index: number) => (
                        <motion.div
                            key={post.id}
                            layout // Enable layout animation for smooth reordering/filtering
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <PostCard
                                post={post}
                                currentUser={{ id: currentUserId }}
                                hasUserReacted={userReactionsSet?.has(post.id)}
                                priority={index < 5}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredPosts.length === 0 && (
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
