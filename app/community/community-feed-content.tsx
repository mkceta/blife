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

    // Fetch all data in parallel on server
    const [
        initialPosts,
        { data: initialPolls },
        { data: initialReactions }
    ] = await Promise.all([
        getCachedPosts(currentCategory, searchQuery),
        // Fetch polls
        supabase
            .from('polls')
            .select(`
                *,
                user:users(alias_inst, avatar_url),
                options:poll_options(*),
                votes:poll_votes(option_id, user_id)
            `)
            .eq('category', currentCategory)
            .order('created_at', { ascending: false }),
        // Fetch user reactions if logged in
        user ? supabase
            .from('reactions')
            .select('post_id')
            .eq('user_id', user.id)
            : Promise.resolve({ data: [] })
    ])

    // Pass all initial data to avoid client-side queries
    return (
        <CommunityFeed
            category={currentCategory}
            searchQuery={searchQuery}
            initialPosts={initialPosts || []}
            initialPolls={initialPolls || []}
            initialReactions={initialReactions?.map(r => r.post_id) || []}
            currentUserId={user?.id}
        />
    )
}
