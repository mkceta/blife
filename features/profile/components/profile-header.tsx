'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Star, ShieldCheck, Settings, Loader2, Award, Shield, Trophy, Lock, HelpCircle, Store, BookOpen, Cpu, Shirt, Rocket, Crown, Key, Users, LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { User } from '@/lib/types'

interface ProfileHeaderProps {
    profile: User
    currentUser: User | null
    stats: {
        listings: number
        sold: number
        flats: number
    }
}

export function ProfileHeader({ profile, currentUser, stats }: ProfileHeaderProps) {
    const isOwner = currentUser?.id === profile.id
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [userBadges, setUserBadges] = useState<Array<{ id: string; name: string; icon_name: string }>>([])
    const supabase = createClient()

    useEffect(() => {
        async function fetchBadges() {
            const { data } = await supabase
                .from('user_badges')
                .select('*, badges(*)')
                .eq('user_id', profile.id)
            if (data) {
                setUserBadges(data.map((ub: { badges: { id: string; name: string; icon_name: string } }) => ub.badges))
            }
        }
        fetchBadges()
    }, [profile.id, supabase])

    const BadgeIcon = ({ name, className }: { name: string, className?: string }) => {
        const Icons: Record<string, LucideIcon> = {
            'ShieldCheck': ShieldCheck,
            'Trophy': Trophy,
            'Award': Award,
            'Shield': Shield,
            'Store': Store,
            'Rocket': Rocket,
            'Crown': Crown,
            'Key': Key,
            'BookOpen': BookOpen,
            'Cpu': Cpu,
            'Shirt': Shirt,
            'Star': Star,
        }
        const Icon = Icons[name] || Award
        return <Icon className={className} />
    }

    async function handleMessage() {
        if (!currentUser) {
            router.push('/auth/login')
            return
        }

        setIsLoading(true)
        try {
            // Check if thread already exists
            const { data: existingThread } = await supabase
                .from('threads')
                .select('id')
                .eq('buyer_id', currentUser.id)
                .eq('seller_id', profile.id)
                .is('listing_id', null)
                .is('flat_id', null)
                .maybeSingle()

            if (existingThread) {
                router.push(`/messages/chat?id=${existingThread.id}`)
                return
            }

            // Create new thread
            const { data: newThread, error } = await supabase
                .from('threads')
                .insert({
                    buyer_id: currentUser.id,
                    seller_id: profile.id,
                    status: 'open',
                    last_message_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            router.push(`/messages/chat?id=${newThread.id}`)

        } catch (error) {
            console.error('Error starting conversation:', error)
            toast.error('Error al iniciar conversación')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-8 px-4 bg-background">
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">

                {/* Left Side: Avatar */}
                <div className="flex-shrink-0 mx-auto md:mx-0 relative group">
                    <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-2xl ring-1 ring-border/10">
                        <AvatarImage src={profile.avatar_url} className="object-cover" />
                        <AvatarFallback className="text-4xl bg-primary/5 text-primary">
                            {profile.alias_inst?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {/* Online Status Dot */}
                    {profile.last_seen && new Date(profile.last_seen).getTime() > Date.now() - 15 * 60 * 1000 && (
                        <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-4 border-background rounded-full shadow-sm" title="Online" />
                    )}
                </div>

                {/* Right Side: Info & Actions */}
                <div className="flex-1 w-full space-y-6">

                    {/* Header Row: Name, Rating, Button */}
                    <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                        <div className="text-center md:text-left space-y-1">
                            <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center md:justify-start gap-2 text-foreground break-all md:break-normal">
                                @{profile.alias_inst}
                            </h1>

                            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
                                <div className="flex text-yellow-500">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-4 w-4 ${star <= (profile.rating_avg || 0) ? 'fill-current' : 'text-muted/30'}`}
                                        />
                                    ))}
                                </div>
                                <span className="font-medium">{profile.rating_count || 0} valoración</span>
                            </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex gap-3">
                            {isOwner ? (
                                <Button variant="outline" className="rounded-full" asChild>
                                    <Link href="/profile/edit">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Editar perfil
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    className="rounded-full font-semibold px-8"
                                    variant="default"
                                    onClick={handleMessage}
                                    disabled={isLoading}
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Contactar
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Bio & Details */}
                    <div className="space-y-4 text-center md:text-left">
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Sobre mí</h3>
                            <p className="text-sm text-foreground/90 leading-relaxed max-w-2xl mx-auto md:mx-0">
                                {profile.bio || "Sin biografía."}
                            </p>
                        </div>

                        <div className="space-y-2 text-sm text-foreground/70 justify-center md:justify-start flex">
                            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-full border border-border/50">
                                <HelpCircle className="h-3.5 w-3.5" />
                                <span>
                                    {profile.last_seen
                                        ? (() => {
                                            const diff = Date.now() - new Date(profile.last_seen).getTime();
                                            const minutes = Math.floor(diff / 60000);
                                            const hours = Math.floor(minutes / 60);
                                            const days = Math.floor(hours / 24);

                                            if (minutes < 5) return "En línea"; // Or "Visto recientemente"
                                            if (minutes < 60) return `Visto hace ${minutes} minutos`;
                                            if (hours < 24) return `Visto hace ${hours} horas`;
                                            if (days < 7) return `Visto hace ${days} días`;
                                            return `Visto el ${new Date(profile.last_seen).toLocaleDateString()}`;
                                        })()
                                        : "Visto recientemente"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Badges Section - Redesigned */}
                    {userBadges.length > 0 && (
                        <div className="pt-4 border-t border-dashed border-border/60 mt-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 text-center md:text-left">Insignias</h3>
                            <div className="flex overflow-x-auto pb-2 justify-start gap-2 scrollbar-hide mask-fade-right">
                                {userBadges.map((badge) => (
                                    <div key={badge.id} className="shrink-0 relative group flex items-center gap-2 p-1 pr-3 bg-gradient-to-br from-background to-muted/30 rounded-full border border-border hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-300 cursor-default select-none">
                                        <div className="p-1.5 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                                            <BadgeIcon name={badge.icon_name} className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                        <span className="text-xs font-medium text-foreground/90">{badge.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Actions */}
                <div className="md:hidden flex w-full gap-3 mt-4">
                    {isOwner ? (
                        <Button variant="outline" className="w-full rounded-full" asChild>
                            <Link href="/profile/edit">
                                <Settings className="mr-2 h-4 w-4" />
                                Editar perfil
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            className="flex-1 rounded-full font-semibold"
                            variant="default"
                            onClick={handleMessage}
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Contactar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
