'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, MessageSquare, Heart, User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useNotifications } from '@/hooks/use-notifications'
import { motion } from 'framer-motion'

export function BottomNav() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const { notifications } = useNotifications()
    const [optimisticPath, setOptimisticPath] = useState<string | null>(null)

    const unreadGeneral = notifications.filter((n) => !n.read && n.type !== 'message').length
    const unreadMessages = notifications.filter((n) => !n.read && n.type === 'message').length

    useEffect(() => {
        setOptimisticPath(null)
    }, [pathname])

    useEffect(() => {
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
        { href: '/home', icon: Home, label: 'Inicio' },
        { href: '/community', icon: Users, label: 'Comunidad' },
        { href: '/wishlist', icon: Heart, label: 'Wishlist' },
        { href: '/messages', icon: MessageSquare, label: 'Mensajes', hasNotifications: true },
        { href: '/notifications', icon: Bell, label: 'Notif.', hasNotifications: true },
        { href: '/profile', icon: User, label: 'Perfil', isProfile: true },
    ]

    if (pathname.startsWith('/auth') || pathname === '/') return null

    const isChatDetail = pathname.startsWith('/messages/') && pathname !== '/messages'
    const isMarketDetail = pathname.startsWith('/market/') && pathname !== '/market'

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-50 glass-strong pb-safe border-t border-white/10",
            (isChatDetail || isMarketDetail) ? "hidden md:block" : ""
        )}>
            <nav className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-2">
                {items.map((item) => {
                    const isActive = optimisticPath
                        ? optimisticPath.startsWith(item.href)
                        : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOptimisticPath(item.href)}
                            aria-label={item.label}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {/* Animated Background & Indicator */}
                            {isActive && (
                                <>
                                    <motion.div
                                        layoutId="navbar-indicator"
                                        className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-primary rounded-b-full shadow-[0_0_10px_rgba(255,0,166,0.8)]"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                    <motion.div
                                        layoutId="navbar-glow"
                                        className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-xl"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                </>
                            )}

                            {item.isProfile ? (
                                user ? (
                                    <div className="relative z-10 flex flex-col items-center space-y-1">
                                        <div className="relative">
                                            <motion.div
                                                animate={{
                                                    scale: isActive ? 1.1 : 1,
                                                    borderColor: isActive ? "var(--primary)" : "transparent"
                                                }}
                                                className={cn(
                                                    "rounded-full border-2 overflow-hidden transition-colors duration-200",
                                                    isActive ? "shadow-glow-primary" : ""
                                                )}
                                            >
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={avatarUrl || undefined} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {user.alias_inst?.substring(0, 2).toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </motion.div>
                                            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-background" />
                                        </div>
                                        <motion.span
                                            animate={{ scale: isActive ? 1.05 : 1, fontWeight: isActive ? 600 : 500 }}
                                            className="text-[10px]"
                                        >
                                            {item.label}
                                        </motion.span>
                                    </div>
                                ) : (
                                    <div className="relative z-10 flex flex-col items-center space-y-1">
                                        <motion.div animate={{ scale: isActive ? 1.2 : 1 }}>
                                            <User className="h-5 w-5" />
                                        </motion.div>
                                        <motion.span
                                            animate={{ scale: isActive ? 1.05 : 1, fontWeight: isActive ? 600 : 500 }}
                                            className="text-[10px]"
                                        >
                                            {item.label}
                                        </motion.span>
                                    </div>
                                )
                            ) : (
                                <div className="relative z-10 flex flex-col items-center space-y-1">
                                    <motion.div
                                        animate={{ scale: isActive ? 1.2 : 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        className="relative"
                                    >
                                        {item.icon && <item.icon className="h-5 w-5" />}
                                        {item.hasNotifications && (
                                            (item.label === 'Notif.' && unreadGeneral > 0) ||
                                            (item.label === 'Mensajes' && unreadMessages > 0)
                                        ) && (
                                                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive border border-background" />
                                            )}
                                    </motion.div>
                                    <motion.span
                                        animate={{ scale: isActive ? 1.05 : 1, fontWeight: isActive ? 600 : 500 }}
                                        className="text-[10px]"
                                    >
                                        {item.label}
                                    </motion.span>
                                </div>
                            )}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
