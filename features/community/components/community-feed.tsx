
'use client'

import { PostCard } from '@/features/community/components/post-card'
import { CommunitySkeleton } from '@/features/community/components/community-skeleton'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { fetchCommunityPostsAction } from '@/app/feed-actions'
import { PollCard } from './poll-card'
import { CACHE_KEYS } from '@/lib/cache-keys'
import { useSupabase } from '@/hooks/use-supabase'
import { useVirtualizer } from '@tanstack/react-virtual'

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
    console.log('DEBUG CommunityFeed initialPosts:', initialPosts)
    const supabase = useSupabase()
    const parentRef = useRef<HTMLDivElement>(null)

    // Safe initialData construction
    const initialDataConfig = useMemo(() => {
        if (Array.isArray(initialPosts) && initialPosts.length > 0) {
            return {
                pages: [initialPosts],
                pageParams: [1]
            }
        }
        return undefined
    }, [initialPosts])

    // 1. Fetch Posts with Infinite Query (Chunks of 20)
    const {
        data: postsData,
        isPending,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        // Append 'v2-infinite' to break compatibility with old flat-array cache
        queryKey: [...CACHE_KEYS.community.posts(category, searchQuery), 'v2-infinite'],
        queryFn: async ({ pageParam = 1 }) => {
            const data = await fetchCommunityPostsAction(category, searchQuery, pageParam as number, 20)
            return Array.isArray(data) ? data : []
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            // Validate lastPage is array before checking length
            if (!Array.isArray(lastPage)) return undefined
            // If last page has fewer items than limit, no more pages
            return lastPage.length === 20 ? allPages.length + 1 : undefined
        },
        initialData: initialDataConfig,
        staleTime: 1000 * 60 * 5, // 5 minutes
        // Crucial: Always refetch on mount if no initial data
        refetchOnMount: !initialDataConfig ? 'always' : false,
    })

    // 2. Fetch Polls (Standard Query - Top 20)
    const { data: pollsData } = useQuery({
        queryKey: CACHE_KEYS.community.polls(category),
        queryFn: async () => {
            // We use client for polls to keep logic simple, or could move to action
            const { data } = await supabase
                .from('polls')
                .select(`
                    *,
                    user:users!user_id(alias_inst, avatar_url),
                    options:poll_options(*),
                    votes:poll_votes(option_id, user_id)
                `)
                .eq('category', category)
                .order('created_at', { ascending: false })
                .limit(20)

            return data || []
        },
        initialData: initialPolls,
        staleTime: 1000 * 60 * 10,
    })

    // 3. User Reactions
    const { data: userReactionsSet } = useQuery({
        queryKey: CACHE_KEYS.community.reactions(currentUserId || ''),
        queryFn: async () => {
            if (!currentUserId) return new Set<string>()
            const { data } = await supabase
                .from('reactions')
                .select('post_id')
                .eq('user_id', currentUserId)
            return new Set(data?.map((r: { post_id: string }) => r.post_id) || [])
        },
        initialData: new Set(initialReactions),
        enabled: !!currentUserId,
        staleTime: 1000 * 60 * 2,
    })

    // Combine data
    const combinedFeed = useMemo(() => {
        const posts = (postsData?.pages.flatMap(p => p) || []).map((p: any) => ({ ...p, type: 'post' }))
        const polls = (pollsData || []).map((p: any) => ({ ...p, type: 'poll' }))
        return [...posts, ...polls].sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }, [postsData, pollsData])

    // Virtualization setup
    const virtualizer = useVirtualizer({
        count: combinedFeed.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 300, // Estimate card height
        overscan: 5,
    })

    // Infinite scroll trigger
    useEffect(() => {
        const [lastItem] = [...virtualizer.getVirtualItems()].reverse()
        if (!lastItem) return

        if (
            lastItem.index >= combinedFeed.length - 1 &&
            hasNextPage &&
            !isFetchingNextPage
        ) {
            fetchNextPage()
        }
    }, [virtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage, fetchNextPage, combinedFeed.length])


    if (!combinedFeed.length && isPending) return <CommunitySkeleton />

    return (
        <PullToRefresh onRefresh={async () => { await refetch() }}>
            {/* Scroll Container for Virtualizer */}
            <div
                ref={parentRef}
                className="h-[calc(100vh-140px)] overflow-y-auto w-full scrollbar-hide px-1"
            >
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                        const item = combinedFeed[virtualItem.index]
                        return (
                            <div
                                key={item.id}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualItem.size}px`,
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                                className="pb-4"
                                ref={virtualizer.measureElement}
                            >
                                {item.type === 'poll' ? (
                                    <PollCard
                                        poll={item}
                                        options={item.options || []}
                                        userVotes={
                                            item.votes
                                                ?.filter((v: { user_id?: string; option_id?: string }) => v.user_id === currentUserId)
                                                .map((v: { user_id?: string; option_id?: string }) => v.option_id) || []
                                        }
                                        currentUserId={currentUserId}
                                    />
                                ) : (
                                    <PostCard
                                        post={item}
                                        currentUser={{ id: currentUserId || '' } as any}
                                        hasUserReacted={userReactionsSet?.has(item.id) || false}
                                        priority={virtualItem.index < 5}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Loading indicator at bottom */}
                {isFetchingNextPage && (
                    <div className="py-4 flex justify-center w-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {/* Empty State */}
                {!isPending && combinedFeed.length === 0 && (
                    <div className="py-20 text-center text-muted-foreground">
                        No hay publicaciones aún.
                    </div>
                )}
            </div>
        </PullToRefresh>
    )
}
