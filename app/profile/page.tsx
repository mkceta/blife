'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ThemeSelector } from '@/components/profile/theme-selector'
import { Award, Heart, Users, Wallet, Package, Rocket, SlidersHorizontal, Percent, LogOut, Shield, ChevronRight, Trophy, BookOpen, Cpu, Shirt, Star, Key, Crown, Settings, Palette } from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BadgesSheet } from '@/components/profile/badges-sheet'
import { SellerDashboardButton } from '@/components/profile/seller-dashboard-button'

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [badgeStats, setBadgeStats] = useState({ total: 0, earned: 0 })
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            let { data: userProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()

            // If profile doesn't exist, create it (simplified version of previous logic)
            if (!userProfile) {
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
                userProfile = newProfile
            }

            setProfile(userProfile)
            setLoading(false)

            // Fetch Badges Stats
            try {
                // Try to auto-award if function exists
                await supabase.rpc('check_and_award_badges', { target_user_id: user.id })

                const { count: totalBadges } = await supabase.from('badges').select('*', { count: 'exact', head: true })
                const { data: myBadges } = await supabase
                    .from('user_badges')
                    .select('*, badges(*)')
                    .eq('user_id', user.id)

                // Set stats
                setBadgeStats({
                    total: totalBadges || 0,
                    earned: myBadges?.length || 0
                })

            } catch (e) {
                console.error("Error fetching badges", e)
            }
        }

        fetchData()
    }, [router, supabase])

    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>
    if (!profile) return null

    const menuItems = [
        { icon: Award, label: 'Insignias ganadas', count: `${badgeStats.earned} de ${badgeStats.total}` },
        { icon: Heart, label: 'Artículos Favoritos', href: '/wishlist' },
        { icon: Users, label: 'Invitar amigos' },
        { icon: Palette, label: 'Apariencia' },
        { icon: Settings, label: 'Ajustes y Perfil', href: '/profile/edit' },
        { icon: LogOut, label: 'Cerrar sesión', action: 'logout', variant: 'destructive' },
        { icon: Shield, label: 'Admin', href: '/admin', show: profile?.role === 'admin', variant: 'destructive' }
    ]

    return (
        <div className="pb-20 bg-background min-h-screen text-foreground">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md pt-safe border-b border-border shadow-sm">
                <div className="flex items-center p-4">
                    <h1 className="text-xl font-bold">Perfil</h1>
                </div>
            </div>

            {/* User Card */}
            <div className="p-4">
                <Link href={`/user/${profile.alias_inst}`} className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card hover:bg-muted/50 transition-colors">
                    <Avatar className="h-16 w-16 border border-border/50">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>{profile.alias_inst?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-xl truncate">{profile.alias_inst}</h2>
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <span>Ver perfil público</span>
                            <ChevronRight className="h-3 w-3" />
                        </div>
                    </div>
                </Link>
            </div>

            {/* Menu List */}
            <div className="px-4 space-y-1">
                {/* Stripe Connect Section */}
                <SellerDashboardButton userId={profile.id} />
                <div className="h-px bg-border/40 my-2 mx-4" />
                {menuItems.map((item, index) => {
                    if (item.show === false) return null

                    const Content = () => (
                        <div className={cn(
                            "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-lg cursor-pointer",
                            item.variant === 'destructive' && "text-red-500 hover:bg-red-50"
                        )}>
                            <item.icon className="h-6 w-6" strokeWidth={1.5} />
                            <span className="flex-1 font-medium">{item.label}</span>
                            {item.count && <span className="text-muted-foreground text-sm">{item.count}</span>}
                            {!item.count && <ChevronRight className="h-5 w-5 text-muted-foreground/50" />}
                        </div>
                    )

                    if (item.label === 'Insignias ganadas') {
                        return (
                            <BadgesSheet key={index} userId={profile.id}>
                                <div>
                                    <Content />
                                </div>
                            </BadgesSheet>
                        )
                    }

                    if (item.label === 'Apariencia') {
                        return (
                            <Sheet key={index}>
                                <SheetTrigger asChild>
                                    <div>
                                        <Content />
                                    </div>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[90vh] sm:h-auto rounded-t-[20px]">
                                    <SheetHeader className="mb-6">
                                        <SheetTitle>Apariencia</SheetTitle>
                                    </SheetHeader>
                                    <div className="pb-10">
                                        <ThemeSelector />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        )
                    }

                    if (item.action === 'logout') {
                        return (
                            <div key={index} onClick={async () => {
                                await supabase.auth.signOut()
                                router.refresh()
                                router.push('/auth/login')
                            }}>
                                <Content />
                            </div>
                        )
                    }

                    return item.href ? (
                        <Link href={item.href} key={index}>
                            <Content />
                        </Link>
                    ) : (
                        <div key={index}>
                            <Content />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
