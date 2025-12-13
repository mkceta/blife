import { createClient } from '@/lib/supabase-server'
import { Award, Heart, Users, Palette, Settings, LogOut, Shield } from 'lucide-react'
import ProfileClient from './profile-client'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch Profile
    let { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    // If profile doesn't exist, create it (safe-guard)
    if (!profile) {
        const emailUsername = user.email?.split('@')[0] || 'user'
        const { data: newProfile } = await supabase
            .from('users')
            .insert({
                id: user.id,
                email: user.email || '',
                uni: 'udc.es',
                alias_inst: emailUsername,
            })
            .select()
            .single()
        profile = newProfile
    }

    // Fetch Badges
    let badgeStats = { total: 0, earned: 0 }
    try {
        // Try to auto-award if function exists
        // Note: RPC calls might fail if function not present, safe to ignore or log
        await supabase.rpc('check_and_award_badges', { target_user_id: user.id })

        const { count: totalBadges } = await supabase.from('badges').select('*', { count: 'exact', head: true })
        const { count: myBadgesCount } = await supabase
            .from('user_badges')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        badgeStats = {
            total: totalBadges || 0,
            earned: myBadgesCount || 0
        }
    } catch (e) {
        console.error("Error fetching badges", e)
    }

    // Prepare Menu Items Data
    const menuItems = [
        { iconName: 'Award', label: 'Insignias ganadas', count: `${badgeStats.earned} de ${badgeStats.total}`, action: 'badges' },
        { iconName: 'Heart', label: 'Artículos Favoritos', href: '/wishlist' },
        { iconName: 'Users', label: 'Invitar amigos' },
        { iconName: 'Palette', label: 'Apariencia', action: 'theme' },
        { iconName: 'Settings', label: 'Ajustes y Perfil', href: '/profile/edit' },
        { iconName: 'LogOut', label: 'Cerrar sesión', action: 'logout', variant: 'destructive' },
        { iconName: 'Shield', label: 'Admin', href: '/admin', show: profile?.role === 'admin', variant: 'destructive' }
    ]

    return (
        <ProfileClient
            profile={profile}
            menuItems={menuItems}
        />
    )
}
