'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ProfileTabs } from '@/components/profile/profile-tabs'

export function PublicProfileContent({ alias }: { alias: string }) {
    const [profile, setProfile] = useState<any>(null)
    const [activeListings, setActiveListings] = useState<any[]>([])
    const [soldListings, setSoldListings] = useState<any[]>([])
    const [flats, setFlats] = useState<any[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            if (!alias) return

            // Decode URL encoding (%40 -> @)
            const decodedUsername = decodeURIComponent(alias)
            let cleanUsername = decodedUsername.startsWith('@') ? decodedUsername.slice(1) : decodedUsername
            if (cleanUsername.includes('@')) {
                cleanUsername = cleanUsername.split('@')[0]
            }

            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)

            // Get user by alias_inst
            const { data: profileData, error } = await supabase
                .from('users')
                .select('*')
                .eq('alias_inst', cleanUsername)
                .single()

            if (error || !profileData) {
                console.error('Error fetching profile:', error)
                setLoading(false)
                return
            }

            setProfile(profileData)

            // Get user's listings
            const { data: listingsData } = await supabase
                .from('listings')
                .select('*')
                .eq('user_id', profileData.id)
                .eq('is_hidden', false)
                .order('created_at', { ascending: false })

            if (listingsData) {
                setActiveListings(listingsData.filter(l => l.status !== 'sold'))
                setSoldListings(listingsData.filter(l => l.status === 'sold'))
            }

            // Get user's flats
            const { data: flatsData } = await supabase
                .from('flats')
                .select('*')
                .eq('user_id', profileData.id)
                .eq('is_hidden', false)
                .order('created_at', { ascending: false })

            if (flatsData) setFlats(flatsData)

            setLoading(false)
        }

        fetchData()
    }, [alias, supabase])

    if (!alias) return <div>No alias provided</div>
    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    if (!profile) return <div className="min-h-screen flex items-center justify-center">User not found</div>

    const stats = {
        listings: activeListings.length,
        sold: soldListings.length,
        flats: flats.length
    }

    return (
        <div className="bg-background min-h-screen pb-20">
            <ProfileHeader
                profile={profile}
                currentUser={currentUser}
                stats={stats}
            />

            <ProfileTabs
                activeListings={activeListings}
                soldListings={soldListings}
                flats={flats}
                profile={profile}
                currentUserId={currentUser?.id}
            />
        </div>
    )
}
