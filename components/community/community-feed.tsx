'use client'

import { createClient } from '@/lib/supabase'
import { PostCard } from '@/components/community/post-card'
import { CommunitySkeleton } from '@/components/community/community-skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'

interface CommunityFeedProps {
    category?: string
    // searchQuery from URL, though we also want client-side search. 
    // If we want "Instant" local search, we should pass the client input here or manage it via URL state but without full reload.
    // For now, let's assume `searchQuery` comes from the URL which was updated via `pushState` (shallow) or we rely on client filtering for speed.
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
    // We use the same fetch logic as server but now client-side for SWR/Revalidation
    const { data: postsData, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['community', category], // Broad key, we filter client-side if needed or server-side if query too complex
        queryFn: async () => {
            let query = supabase
                .from('posts')
                .select(`
                    *,
                    user:users!posts_user_id_fkey(id, alias_inst, avatar_url)
                `)
                .eq('is_hidden', false)
                .order('created_at', { ascending: false })
                .limit(100) // Increased limit for Client-Side "Instant" filtering potential

            if (category && category !== 'General' && category !== 'Todos') {
                query = query.contains('category', [category])
            }

            // Note: We are deliberately NOT filtering by search text here to allow client-side instant search on recent posts
            // unless the user performs a deep search (which would be a separate refetch or different mode)

            const { data } = await query
            return data || []
        },
        initialData: initialPosts,
        staleTime: 1000 * 60, // 1 minute stale time to prevent immediate refetch on mount if server data is fresh
    })

    // 2. Fetch User Reactions with React Query
    const { data: userReactionsSet } = useQuery({
        queryKey: ['community-reactions', currentUserId, // We depend on postsData IDs effectively
            postsData?.map(p => p.id).join(',')
        ],
        queryFn: async () => {
            if (!currentUserId || !postsData || postsData.length === 0) return new Set<string>()

            const postIds = postsData.map(p => p.id)
            const { data: reactions } = await supabase
                .from('reactions')
                .select('target_id')
                .eq('user_id', currentUserId)
                .eq('target_type', 'post')
                .in('target_id', postIds)

            return new Set(reactions?.map((r: any) => r.target_id) || [])
        },
        initialData: new Set(initialReactions),
        enabled: !!currentUserId && !!postsData && postsData.length > 0,
        staleTime: 1000 * 60 * 5 // 5 mins
    })

    // 3. Client-Side Filtering for Instant Search
    const filteredPosts = useMemo(() => {
        if (!postsData) return []
        if (!searchQuery) return postsData

        const lowerQuery = searchQuery.toLowerCase()
        return postsData.filter((post: any) =>
            post.text?.toLowerCase().includes(lowerQuery) ||
            post.title?.toLowerCase().includes(lowerQuery) // If title exists
        )
    }, [postsData, searchQuery])


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
