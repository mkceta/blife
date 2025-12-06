'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Award, Heart, Users, Wallet, Package, Rocket, SlidersHorizontal, Percent, LogOut, Shield, ChevronRight } from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
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
        }

        fetchData()
    }, [router, supabase])

    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>
    if (!profile) return null

    const menuItems = [
        { icon: Award, label: 'Insignias ganadas', count: '0 de 2' },
        { icon: Heart, label: 'Artículos Favoritos', href: '/wishlist' },
        { icon: Users, label: 'Invitar amigos' },
        { icon: Wallet, label: 'Mi saldo', value: '0,00 €' },
        { icon: Package, label: 'Mis pedidos' },
        { icon: Rocket, label: 'Herramientas de promoción' },
        { icon: SlidersHorizontal, label: 'Personalización', href: '/profile/edit' },
        { icon: Percent, label: 'Descuento por lote', value: 'hasta el 20 %' },
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
                <Link href={`/user/profile?alias=${profile.alias_inst}`} className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card hover:bg-muted/50 transition-colors">
                    <Avatar className="h-14 w-14 border border-border/50">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>{profile.alias_inst?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h2 className="font-bold text-lg">{profile.alias_inst}</h2>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Ver mis anuncios
                            <ChevronRight className="h-3 w-3" />
                        </p>
                    </div>
                </Link>
            </div>

            {/* Menu List */}
            <div className="px-4 space-y-1">
                {menuItems.map((item, index) => {
                    if (item.show === false) return null

                    const Content = () => (
                        <div className={cn(
                            "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-lg cursor-pointer",
                            item.variant === 'destructive' && "text-red-500 hover:bg-red-50"
                        )}>
                            <item.icon className="h-6 w-6" strokeWidth={1.5} />
                            <span className="flex-1 font-medium">{item.label}</span>
                            {item.value && <span className="text-muted-foreground text-sm">{item.value}</span>}
                            {item.count && <span className="text-muted-foreground text-sm">{item.count}</span>}
                            {!item.value && !item.count && <ChevronRight className="h-5 w-5 text-muted-foreground/50" />}
                        </div>
                    )

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
