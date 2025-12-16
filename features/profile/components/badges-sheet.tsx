'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Award, ShieldCheck, Trophy, Lock, HelpCircle, Shield, Store, BookOpen, Cpu, Shirt, Star, Rocket, Crown, Key, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface Badge {
    id: string
    code: string
    name: string
    description: string
    icon_name: string
    created_at: string
}

interface UserBadge {
    badge_id: string
    awarded_at: string
}

const ICON_MAP: Record<string, LucideIcon> = {
    'ShieldCheck': ShieldCheck,
    'Trophy': Trophy,
    'Award': Award,
    'Shield': Shield,
    'Store': Store,
    'BookOpen': BookOpen,
    'Cpu': Cpu,
    'Shirt': Shirt,
    'Star': Star,
    'Rocket': Rocket,
    'Crown': Crown,
    'Key': Key,
}

export function BadgesSheet({ children, userId }: { children: React.ReactNode, userId: string }) {
    const [open, setOpen] = useState(false)
    const [allBadges, setAllBadges] = useState<Badge[]>([])
    const [userBadges, setUserBadges] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (open) {
            setLoading(true)
            Promise.all([
                supabase.from('badges').select('*').order('name'),
                supabase.from('user_badges').select('badge_id').eq('user_id', userId)
            ]).then(([badgesRes, userBadgesRes]) => {
                if (badgesRes.data) setAllBadges(badgesRes.data)
                if (userBadgesRes.data) {
                    setUserBadges(new Set(userBadgesRes.data.map((ub: { badge_id: string }) => ub.badge_id)))
                }
                setLoading(false)
            })
        }
    }, [open, userId, supabase])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl flex flex-col p-0">
                <SheetHeader className="p-6 pb-2 shrink-0">
                    <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                        <Award className="h-6 w-6 text-primary" />
                        Insignias
                    </SheetTitle>
                    <SheetDescription>
                        Desbloquea insignias completando logros en la aplicación.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 pb-8">
                    {loading ? (
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} className="h-32 rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {allBadges.map((badge) => {
                                const isUnlocked = userBadges.has(badge.id)
                                const IconData = ICON_MAP[badge.icon_name] || HelpCircle

                                return (
                                    <div
                                        key={badge.id}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center p-6 rounded-2xl border text-center gap-3 transition-all",
                                            isUnlocked
                                                ? "bg-primary/5 border-primary/20 shadow-sm"
                                                : "bg-muted/30 border-muted grayscale opacity-70"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-16 w-16 rounded-full flex items-center justify-center mb-1 transition-all",
                                            isUnlocked
                                                ? "bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-inner"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {isUnlocked ? (
                                                <IconData className="h-8 w-8" strokeWidth={1.5} />
                                            ) : (
                                                <Lock className="h-6 w-6" />
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <div className="font-semibold leading-tight">{badge.name}</div>
                                            <div className="text-xs text-muted-foreground leading-relaxed px-1">
                                                {badge.description}
                                            </div>
                                        </div>

                                        {isUnlocked && (
                                            <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary animate-pulse" />
                                        )}
                                    </div>
                                )
                            })}

                            {allBadges.length === 0 && (
                                <div className="col-span-2 py-12 text-center text-muted-foreground">
                                    No hay insignias disponibles todavía.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
