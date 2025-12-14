'use client'

import { CommunityFeed } from '@/components/community/community-feed'

export function CommunityFeedContent({
    searchParams,
}: {
    searchParams: Promise<{ category?: string, q?: string }>
}) {
    // Just pass through - CommunityFeed will handle everything with React Query
    return (
        <CommunityFeed
            category="General"
            searchQuery=""
            initialPosts={[]}
            initialPolls={[]}
            initialReactions={[]}
            currentUserId={undefined}
        />
    )
}
