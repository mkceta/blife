'use client'

import { CommunityFeed } from '@/features/community/components/community-feed'
import type { Post, Poll } from '@/lib/types'

interface CommunityFeedContentProps {
    initialPosts: Post[]
    initialPolls: Poll[]
    category: string
    searchQuery: string
    currentUserId?: string
}

export function CommunityFeedContent({
    initialPosts,
    initialPolls,
    category,
    searchQuery,
    currentUserId,
}: CommunityFeedContentProps) {
    // CommunityFeed will handle everything with React Query
    // but now receives real server-fetched data as initialData
    return (
        <CommunityFeed
            category={category}
            searchQuery={searchQuery}
            initialPosts={initialPosts}
            initialPolls={initialPolls}
            initialReactions={[]}
            currentUserId={currentUserId}
        />
    )
}

