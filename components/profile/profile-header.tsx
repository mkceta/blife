'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Star, ShieldCheck, Settings, Loader2, Award, Shield, Trophy, Lock, HelpCircle, Store, BookOpen, Cpu, Shirt, Rocket, Crown, Key } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

interface ProfileHeaderProps {
    profile: any
    currentUser: any
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
    const [userBadges, setUserBadges] = useState<any[]>([])
    const supabase = createClient()

    useState(() => {
        async function fetchBadges() {
            const { data } = await supabase
                .from('user_badges')
                .select('*, badges(*)')
                .eq('user_id', profile.id)
            if (data) {
                setUserBadges(data.map((ub: any) => ub.badges))
            }
        }
        fetchBadges()
    })

    const BadgeIcon = ({ name, className }: { name: string, className?: string }) => {
        const Icons: any = {
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
        <div className="flex flex-col items-center pt-6 pb-6 px-4 bg-background">
            <div className="relative mb-4">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                        {profile.alias_inst?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                {/* Online Status Dot */}
                {profile.last_seen && new Date(profile.last_seen).getTime() > Date.now() - 15 * 60 * 1000 && (
                    <div className="absolute bottom-1 right-1 h-5 w-5 bg-green-500 border-4 border-background rounded-full" />
                )}
            </div>

            <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
                    @{profile.alias_inst}
                    {profile.is_verified && <ShieldCheck className="h-5 w-5 text-blue-500" />}
                </h1>

                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <div className="flex text-yellow-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`h-4 w-4 ${star <= (profile.rating_avg || 0) ? 'fill-current' : 'text-muted/30'}`}
                            />
                        ))}
                    </div>
                    <span>({profile.rating_count || 0})</span>
                </div>

                {profile.location && (
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground pt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.location}
                    </div>
                )}
            </div>

            {/* Badges Row */}
            {userBadges.length > 0 && (
                <div className="flex gap-2 mt-4 justify-center flex-wrap max-w-xs">
                    {userBadges.map((badge) => (
                        <div key={badge.id} className="relative group p-2 bg-muted/40 rounded-full border border-border/50" title={badge.name}>
                            <BadgeIcon name={badge.icon_name} className="h-5 w-5 text-foreground/80" />
                            {/* Mobile tooltip check */}
                        </div>
                    ))}
                </div>
            )}

            {profile.bio && (
                <p className="mt-4 text-center text-sm text-foreground/80 max-w-sm leading-relaxed">
                    {profile.bio}
                </p>
            )}

            <div className="flex gap-6 mt-6 w-full max-w-xs justify-center text-center">
                <div>
                    <div className="font-bold text-lg">{stats.listings}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">En Venta</div>
                </div>
                <div className="w-px bg-border/50" />
                <div>
                    <div className="font-bold text-lg">{stats.sold}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Vendidos</div>
                </div>
                <div className="w-px bg-border/50" />
                <div>
                    <div className="font-bold text-lg">{profile.followers_count || 0}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Seguidores</div>
                </div>
            </div>

            <div className="mt-6 flex gap-3 w-full max-w-sm">
                {isOwner ? (
                    <Button variant="outline" className="w-full rounded-full border-primary/20 text-primary hover:text-primary hover:bg-primary/5" asChild>
                        <Link href="/user/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Editar perfil
                        </Link>
                    </Button>
                ) : (
                    <>
                        <Button className="flex-1 rounded-full font-semibold" variant="default">
                            Seguir
                        </Button>
                        <Button
                            className="flex-1 rounded-full font-semibold"
                            variant="outline"
                            onClick={handleMessage}
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Mensaje
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
