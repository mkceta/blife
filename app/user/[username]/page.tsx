
import { createServerClient } from '@/lib/supabase/server'
import { ProfileHeader } from '@/features/profile/components/profile-header'
import { ProfileTabs } from '@/features/profile/components/profile-tabs'
import { notFound } from 'next/navigation'
import { getProfileByUsername, getProfileListings, getProfileFlats, getProfileStats } from '@/lib/services/profile.service'

interface PageProps {
    params: Promise<{
        username: string
    }>
}

/**
 * Public Profile Page - Server Component
 * 
 * Fetches all data in parallel on the server for fast initial load
 * Implements pagination readiness (chunks of 20)
 */
export default async function PublicProfilePage(props: PageProps) {
    const params = await props.params
    const { username } = params

    if (!username) {
        notFound()
    }

    // Use cached service
    const profile = await getProfileByUsername(username)

    if (!profile) {
        notFound()
    }

    // Parallel fetch: Stats + Initial Page (Chunk 1) for each category
    const [stats, activeListings, soldListings, flats] = await Promise.all([
        getProfileStats(profile.id),
        getProfileListings(profile.id, 1, 20, 'active'),
        getProfileListings(profile.id, 1, 20, 'sold'),
        getProfileFlats(profile.id, 1, 20)
    ])

    const supabase = await createServerClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    return (
        <div className="bg-background min-h-screen pb-20">
            <ProfileHeader
                profile={profile}
                currentUser={currentUser as any}
                stats={stats}
            />

            <ProfileTabs
                activeListings={activeListings}
                soldListings={soldListings}
                flats={flats || []}
                profile={profile}
                currentUserId={currentUser?.id || ''}
            />
        </div>
    )
}
