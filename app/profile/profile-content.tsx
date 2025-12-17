'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ThemeSelector } from '@/features/profile/components/theme-selector'
import { Award, Heart, Users, Wallet, Package, Rocket, SlidersHorizontal, Percent, LogOut, Shield, ChevronRight, Trophy, BookOpen, Cpu, Shirt, Star, Key, Crown, Settings, Palette, TestTube } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BadgesSheet } from '@/features/profile/components/badges-sheet'
import { SellerDashboardButton } from '@/features/profile/components/seller-dashboard-button'

import type { User, Listing } from '@/lib/types'

interface ProfileContentProps {
    initialProfile: User
    initialActiveListings: Listing[]
    initialSoldListings: Listing[]
    initialFlats: unknown[]
    userId: string
}

export function ProfileContent({
    initialProfile,
    initialActiveListings,
    initialSoldListings,
    initialFlats,
    userId
}: ProfileContentProps) {
    const router = useRouter()
    const supabase = createClient()

    // Use initialData from server for instant render
    const [profile] = useState(initialProfile)

    const { data: badgeStats = { total: 0, earned: 0 } } = useQuery({
        queryKey: ['badge-stats', userId],
        queryFn: async () => {
            try {
                // Try to auto-award if function exists
                await supabase.rpc('check_and_award_badges', { target_user_id: userId })

                const { count: totalBadges } = await supabase.from('badges').select('*', { count: 'exact', head: true })
                const { data: myBadges } = await supabase
                    .from('user_badges')
                    .select('*, badges(*)')
                    .eq('user_id', userId)

                return {
                    total: totalBadges || 0,
                    earned: myBadges?.length || 0
                }
            } catch (e) {
                console.error("Error fetching badges", e)
                return { total: 0, earned: 0 }
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in memory
    })

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
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md pt-safe shadow-sm">
                <div className="flex items-center p-4">
                    <h1 className="text-xl font-bold">Perfil</h1>
                </div>
            </div>

            {/* User Card */}
            <div className="px-4 pb-4 pt-0">
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
                <SellerDashboardButton userId={profile.id} initialStripeConnected={profile.stripe_connected} />
                <div className="h-px bg-border/40 my-2 mx-4" />
                {menuItems.map((item, index) => {
                    if (item.show === false) return null

                    const Content = () => (
                        <div className={cn(
                            "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-lg cursor-pointer",
                            item.variant === 'destructive' && "text-red-500 hover:bg-red-50",
                            item.variant === 'secondary' && "text-blue-500 hover:bg-blue-50/50"
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

