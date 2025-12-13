import { CommunityFeed } from '@/components/community/community-feed'
import { getCachedPosts } from '@/lib/community-data'
import { createClient } from '@/lib/supabase-server'

export async function CommunityFeedContent({
    searchParams,
}: {
    searchParams: Promise<{ category?: string, q?: string }>
}) {
    const params = await searchParams
    const currentCategory = params.category || 'General'
    const searchQuery = params.q || ''

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Skip server-side data fetching for posts to allow instant navigation.
    // Client side React Query will handle cache and background fetching.

    // We pass empty arrays to force client fetch/cache usage
    return (
        <CommunityFeed
            category={currentCategory}
            searchQuery={searchQuery}
            initialPosts={[]}
            initialReactions={[]}
            currentUserId={user?.id}
        />
    )
}
