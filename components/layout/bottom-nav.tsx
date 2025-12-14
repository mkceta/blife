'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FlameKindling, MessageCircle, Heart, User, Search, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useNotifications } from '@/hooks/use-notifications'
import { mediumHaptic } from '@/lib/haptics'
import { usePrefetchMarket, usePrefetchCommunity } from '@/hooks/use-prefetch'


export function BottomNav() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const { notifications } = useNotifications()

    // Prefetch hooks for instant navigation
    const marketPrefetch = usePrefetchMarket()
    const communityPrefetch = usePrefetchCommunity()

    const unreadCommunity = notifications.filter((n) => !n.read && (n.type === 'comment' || n.type === 'reaction')).length
    const unreadMessages = notifications.filter((n) => !n.read && n.type === 'message').length

    useEffect(() => {
        setMounted(true)

        const supabase = createClient()
        async function loadUser() {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) return

            const { data: profile } = await supabase
                .from('users')
                .select('avatar_url, alias_inst, last_seen')
                .eq('id', authUser.id)
                .single()

            if (profile) {
                setUser(profile)
                setAvatarUrl(profile.avatar_url)
            }
        }
        loadUser()
    }, [])

    const items = [
        { href: '/home', icon: Home, label: 'Inicio', activeIcon: Home },
        { href: '/search', icon: Search, label: 'Buscar', activeIcon: Search }, // Replaced community with Search for Vinted feel? or keep community? Let's stick to user request about "Vinted structure". Vinted has: Home, Search, Sell, Inbox, Profile.
        { href: '/market/new', icon: PlusCircle, label: 'Vender', isAction: true }, // "Vender" is central in Vinted
        { href: '/messages', icon: MessageCircle, label: 'Buzón', hasNotifications: true },
        { href: '/profile', icon: User, label: 'Perfil', isProfile: true },
    ]

    // Restore Community and Heart if we want to adapt closer to Blife original features but with Vinted style. 
    // Vinted: [Inicio, Buscar, Vender, Buzón, Perfil]
    // Blife: [Inicio, Comunidad, Wishlist, Mensajes, Perfil]
    // Let's hybridize: Keep Blife features but clean style.
    // [Inicio, Buscar (replaced Community?), Vender (Central), Mensajes, Perfil]
    // "Comunidad" is important for Blife? Let's keep "Comunidad" instead of "Search" for now if it's a social app.
    // But user said "Usa el layout de su UI". Vinted uses Search heavily.
    // Let's stick to Blife's content but Vinted's *Visual Style*.

    const blifeItems = [
        { href: '/market', icon: Home, label: 'Inicio', prefetch: marketPrefetch },
        { href: '/community', icon: FlameKindling, label: 'Comunidad', prefetch: communityPrefetch },
        { href: '/market/new', icon: PlusCircle, label: 'Vender', isMiddle: false }, // Changed isMiddle to false to remove floating effect if we want strict Vinted style, or keep it if user likes the emphasis. Vinted has it inline.
        { href: '/messages', icon: MessageCircle, label: 'Mensajes', hasNotifications: true },
        { href: '/profile', icon: User, label: 'Perfil', isProfile: true },
    ]

    if (pathname.startsWith('/auth') || pathname === '/landing') return null

    // Prevent hydration mismatch
    if (!mounted) {
        return <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border pb-safe h-14 md:hidden" />
    }

    const isChatDetail = pathname.startsWith('/messages/') && pathname !== '/messages'
    const isMarketDetail = pathname.startsWith('/market/') && pathname !== '/market'

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border pb-safe md:hidden",
            (isChatDetail || isMarketDetail) ? "hidden" : ""
        )}>
            <nav className="grid grid-cols-5 items-center h-14 max-w-screen-xl mx-auto px-0 w-full">
                {blifeItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)

                    if (item.isMiddle) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-label={item.label}
                                className="flex flex-col items-center justify-center -mt-4"
                            >
                                <div className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-3 shadow-lg hover:shadow-primary/25 transition-all">
                                    <item.icon className="h-6 w-6 stroke-[2.5]" />
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-1 font-medium">{item.label}</span>
                            </Link>
                        )
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            onClick={() => mediumHaptic()}
                            onMouseEnter={item.prefetch?.handleMouseEnter}
                            onTouchStart={item.prefetch?.handleTouchStart}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-0.5 active-press w-full h-full",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground/80"
                            )}
                        >
                            <div className="relative h-6 w-6">
                                {item.isProfile && user ? (
                                    <Avatar className={cn("h-6 w-6 border-2 transition-all", isActive ? "border-primary" : "border-transparent")}>
                                        <AvatarImage src={avatarUrl || undefined} />
                                        <AvatarFallback className="text-[10px]">
                                            {user.alias_inst?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <>
                                        {isActive && item.label === 'Comunidad' ? (
                                            <>
                                                {/* Filled Layer - Orange Fire */}
                                                <item.icon className="absolute inset-0 h-6 w-6 text-primary fill-primary stroke-0" />
                                                {/* Outline Layer - Accent Color */}
                                                <item.icon className="absolute inset-0 h-6 w-6 text-primary stroke-[2.5] fill-none" />
                                            </>
                                        ) : (
                                            <item.icon className={cn(
                                                "h-6 w-6 transition-all absolute inset-0",
                                                isActive
                                                    ? (item.icon === Search)
                                                        ? "stroke-[2.5]"
                                                        : "stroke-0 fill-current"
                                                    : "stroke-2"
                                            )} />
                                        )}
                                    </>
                                )}

                                {item.hasNotifications && (
                                    (item.label === 'Comunidad' && unreadCommunity > 0) ||
                                    (item.label === 'Mensajes' && unreadMessages > 0)
                                ) && (
                                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive border-[1.5px] border-background z-10" />
                                    )}
                            </div>
                            <span className={cn("text-[10px] font-medium")}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
