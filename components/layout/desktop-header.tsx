'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Search,
    Bell,
    Heart,
    User,
    FlameKindling,
    HelpCircle,
    ChevronDown,
    Mail,
    Camera
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/hooks/use-notifications'

export function DesktopHeader() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const isFlats = pathname?.includes('/flats')
    const [user, setUser] = useState<any>(null)
    const { notifications } = useNotifications()
    const unreadMessages = notifications.filter(n => !n.read && n.type === 'message').length
    const supabase = createClient()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
                setUser(profile)
            } else {
                setUser(null)
            }
        }

        fetchUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                fetchUser()
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const q = formData.get('q') as string
        const target = isFlats ? '/flats' : '/market'
        if (q) {
            router.push(`${target}?q=${encodeURIComponent(q)}`)
        }
    }

    // Hide header on landing page and auth pages
    if (pathname === '/' || pathname?.startsWith('/auth')) {
        return null
    }

    return (
        <div className="hidden md:block w-full border-b border-border/40 bg-background sticky top-0 z-50">
            {/* Top Navigation Row */}
            <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/market" className="flex-shrink-0">
                    <h1 className="text-2xl font-bold text-primary tracking-tight" style={{ fontFamily: 'var(--font-open-sans)' }}>BLife</h1>
                </Link>

                {/* Search Bar Section */}
                <div className="flex-1 max-w-2xl flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="gap-1 text-muted-foreground font-normal">
                                {isFlats ? 'Pisos' : 'Artículos'}
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => router.push('/market')}>
                                Artículos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/flats')}>
                                Pisos
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <Input
                            name="q"
                            defaultValue={searchParams.get('q') || ''}
                            placeholder={isFlats ? "Buscar pisos..." : "Buscar artículos"}
                            className="w-full bg-muted/50 border-border/50 focus-visible:ring-1 pl-10 pr-4 rounded-full text-sm h-9"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </form>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative text-muted-foreground hover:text-foreground"
                                    onClick={() => router.push('/messages')}
                                >
                                    <Mail className="h-5 w-5" />
                                    {unreadMessages > 0 && (
                                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-destructive text-[10px]">
                                            {unreadMessages}
                                        </Badge>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => router.push('/notifications')}
                                >
                                    <Bell className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => router.push('/community')}
                                >
                                    <FlameKindling className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => router.push('/wishlist')}
                                >
                                    <Heart className="h-5 w-5" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="gap-2 pl-2 pr-1">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={user.avatar_url} />
                                                <AvatarFallback>{user.alias_inst?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push('/profile')}>Mi perfil</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/profile/edit')}>Ajustes</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">Cerrar sesión</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <Button className="bg-primary hover:bg-primary/90 text-white font-medium px-4" onClick={() => router.push('/market/new')}>
                                Publicar
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => router.push('/auth/register')}>Regístrate</Button>
                            <Button onClick={() => router.push('/auth/login')}>Inicia sesión</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
