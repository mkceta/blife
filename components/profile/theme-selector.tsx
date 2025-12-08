'use client'

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Check, Lock, Palette, Moon, Sun, Sparkles, Gem } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ThemeSelectorProps {
    value?: string
    onValueChange?: (value: string) => void
}

export function ThemeSelector({ value, onValueChange }: ThemeSelectorProps) {
    const { theme: systemTheme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [earnedBadges, setEarnedBadges] = useState(0)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    // Use controlled value if provided, otherwise system theme
    const activeTheme = value || systemTheme

    useEffect(() => {
        setMounted(true)
        async function fetchBadges() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { count } = await supabase
                    .from('user_badges')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)

                setEarnedBadges(count || 0)
            }
            setLoading(false)
        }
        fetchBadges()
    }, [supabase])

    if (!mounted) {
        return <Skeleton className="h-32 w-full rounded-xl" />
    }

    const handleThemeSelect = (themeId: string) => {
        if (onValueChange) {
            onValueChange(themeId)
        } else {
            setTheme(themeId)
        }
    }

    const themes = [
        {
            id: 'system',
            name: 'Sistema',
            icon: Palette,
            color: 'bg-background border-border',
            minBadges: 0
        },
        {
            id: 'light',
            name: 'Claro',
            icon: Sun,
            color: 'bg-white border-slate-200 text-slate-900',
            minBadges: 0
        },
        {
            id: 'dark',
            name: 'Oscuro',
            icon: Moon,
            color: 'bg-slate-950 border-slate-800 text-slate-50',
            minBadges: 0
        },
        {
            id: 'midnight',
            name: 'Midnight',
            icon: Sparkles,
            color: 'bg-[#020617] border-[#1E293B] text-[#7C3AED]',
            minBadges: 5,
            description: 'Desbloquea con 5 insignias'
        },
        {
            id: 'gold',
            name: 'Gold',
            icon: Gem,
            color: 'bg-[#0C0A09] border-[#44403C] text-[#D4AF37]',
            minBadges: 10,
            description: 'Desbloquea con 10 insignias'
        }
    ]

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Tema de la aplicación</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {themes.map((t) => {
                    const isLocked = earnedBadges < t.minBadges
                    const isActive = activeTheme === t.id

                    return (
                        <button
                            key={t.id}
                            type="button" // Prevent form submission
                            disabled={isLocked}
                            onClick={() => handleThemeSelect(t.id)}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all h-32",
                                t.color,
                                isActive ? "border-primary ring-2 ring-primary/20" : "border-muted hover:border-primary/50",
                                isLocked && "opacity-50 cursor-not-allowed hover:border-muted grayscale"
                            )}
                        >
                            <t.icon className={cn("h-6 w-6", isLocked && "opacity-50")} />
                            <span className="font-medium text-sm">{t.name}</span>

                            {isActive && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                    <Check className="h-3 w-3" />
                                </div>
                            )}

                            {isLocked && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px] rounded-xl p-2 text-center">
                                    <Lock className="h-5 w-5 text-white mb-1" />
                                    <p className="text-[10px] text-white font-medium px-2">
                                        {t.minBadges} insignias
                                    </p>
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Progress bar info if next theme is close */}
            {earnedBadges < 10 && (
                <div className="mt-2 text-sm text-muted-foreground text-center">
                    Tienes <span className="text-primary font-bold">{earnedBadges}</span> insignias.
                    {earnedBadges < 5 ? (
                        <span> Consigue {5 - earnedBadges} más para desbloquear Midnight.</span>
                    ) : earnedBadges < 10 ? (
                        <span> Consigue {10 - earnedBadges} más para desbloquear Gold.</span>
                    ) : null}
                </div>
            )}
        </div>
    )
}
