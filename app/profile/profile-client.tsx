'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ThemeSelector } from '@/components/profile/theme-selector'
import { Award, Heart, Users, Palette, Settings, LogOut, Shield, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BadgesSheet } from '@/components/profile/badges-sheet'
import { SellerDashboardButton } from '@/components/profile/seller-dashboard-button'
import { motion } from 'framer-motion'

// Map icon names to components
const ICONS = {
    Award,
    Heart,
    Users,
    Palette,
    Settings,
    LogOut,
    Shield
}

interface MenuItem {
    iconName: keyof typeof ICONS
    label: string
    count?: string
    href?: string
    action?: string
    show?: boolean
    variant?: 'destructive' | 'secondary' | 'default'
}

interface ProfileClientProps {
    profile: any
    menuItems: MenuItem[]
}

export default function ProfileClient({ profile, menuItems }: ProfileClientProps) {
    const router = useRouter()
    const supabase = createClient()

    return (
        <div className="pb-20 bg-background min-h-screen text-foreground">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+0.5rem)] shadow-sm">
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
            <motion.div
                className="px-4 space-y-1"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.05 } }
                }}
            >
                {/* Stripe Connect Section */}
                <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                    <SellerDashboardButton userId={profile.id} />
                </motion.div>
                <div className="h-px bg-border/40 my-2 mx-4" />

                {menuItems.map((item, index) => {
                    if (item.show === false) return null

                    const Icon = ICONS[item.iconName]

                    const Content = () => (
                        <motion.div
                            className={cn(
                                "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-lg cursor-pointer",
                                item.variant === 'destructive' && "text-destructive hover:bg-destructive/10",
                                item.variant === 'secondary' && "text-blue-500 hover:bg-blue-50/50"
                            )}
                            variants={{
                                hidden: { opacity: 0, x: -20 },
                                visible: { opacity: 1, x: 0 }
                            }}
                        >
                            <Icon className="h-6 w-6" strokeWidth={1.5} />
                            <span className="flex-1 font-medium">{item.label}</span>
                            {item.count && <span className="text-muted-foreground text-sm">{item.count}</span>}
                            {!item.count && <ChevronRight className="h-5 w-5 text-muted-foreground/50" />}
                        </motion.div>
                    )

                    if (item.action === 'badges') {
                        return (
                            <BadgesSheet key={index} userId={profile.id}>
                                <div>
                                    <Content />
                                </div>
                            </BadgesSheet>
                        )
                    }

                    if (item.action === 'theme') {
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
            </motion.div>
        </div>
    )
}
