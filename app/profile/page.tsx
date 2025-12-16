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
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect('/auth/login?redirectTo=/profile')
    }

    // Use Service Layer - Cleaner, testable, and robust
    const { profile, activeListings, soldListings, flats } = await getMyProfileFullData(user.id)

    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <ProfileContent
                initialProfile={profile}
                initialActiveListings={activeListings}
                initialSoldListings={soldListings}
                initialFlats={flats}
                userId={user.id}
            />
        </Suspense>
    )
}

