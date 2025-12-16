import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ProfileContent } from './profile-content'
import { getMyProfileFullData } from '@/lib/services/profile.service'

/**
 * Profile Page - Server Component
 * 
 * Uses Service Layer for data fetching
 */
export default async function ProfilePage() {
    let user: any = null
    let profileData: any = { profile: null, activeListings: [], soldListings: [], flats: [] }

    try {
        const supabase = await createServerClient()
        const { data, error: authError } = await supabase.auth.getUser()

        if (authError || !data.user) {
            redirect('/auth/login?redirectTo=/profile')
        }

        user = data.user
        profileData = await getMyProfileFullData(user.id)
    } catch (error) {
        console.error('ProfilePage error:', error)
        // Redirect to login on any error
        redirect('/auth/login?redirectTo=/profile')
    }

    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <ProfileContent
                initialProfile={profileData.profile}
                initialActiveListings={profileData.activeListings}
                initialSoldListings={profileData.soldListings}
                initialFlats={profileData.flats}
                userId={user!.id}
            />
        </Suspense>
    )
}

