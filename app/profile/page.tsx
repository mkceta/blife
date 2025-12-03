'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Star, Package, Home, Shield, GraduationCap, Stethoscope, Briefcase, Building2, Dna, Scale, Baby, Users, BadgeCheck, Pencil, LogOut, Laptop, CreditCard } from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'
import Link from 'next/link'
import { getUniversityName } from '@/lib/format'
import { ProfileTabs } from '@/components/profile/profile-tabs'

// Helper to get icon for degree
function getDegreeIcon(degree: string | null) {
    if (!degree) return null
    if (degree.includes('Informática')) return Laptop
    if (degree.includes('Industrial')) return Building2
    if (degree.includes('ADE') || degree.includes('Administración')) return Briefcase
    if (degree.includes('Enfermería')) return Stethoscope
    if (degree.includes('Arquitectura')) return Home
    if (degree.includes('Biología')) return Dna
    if (degree.includes('Derecho')) return Scale
    if (degree.includes('Infantil')) return Baby
    if (degree.includes('Primaria') || degree.includes('Fisioterapia')) return Users
    return GraduationCap
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null)
    const [activeListings, setActiveListings] = useState<any[]>([])
    const [soldListings, setSoldListings] = useState<any[]>([])
    const [flats, setFlats] = useState<any[]>([])
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

            let { data: userProfile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()

            // If profile doesn't exist, create it
            if (!userProfile) {
                // Extract username from email (remove @udc.es or @udc.gal)
                const emailUsername = user.email?.split('@')[0] || 'user'

                const { data: newProfile, error: createError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        email: user.email || '',
                        uni: user.user_metadata?.uni || 'udc.es',
                        alias_inst: user.user_metadata?.alias_inst || emailUsername,
                        avatar_url: user.user_metadata?.avatar_url || null,
                    })
                    .select()
                    .single()

                if (createError) {
                    console.error('Error creating user profile:', createError)
                    router.push('/auth/login')
                    return
                }
                userProfile = newProfile
            }

            setProfile(userProfile)

            // Get user's listings
            const { data: listings } = await supabase
                .from('listings')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_hidden', false)
                .order('created_at', { ascending: false })

            // Get user's flats
            const { data: flatsData } = await supabase
                .from('flats')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_hidden', false)
                .order('created_at', { ascending: false })

            // Separate listings into active and sold
            const active = listings?.filter(l => l.status !== 'sold') || []
            const sold = listings?.filter(l => l.status === 'sold') || []

            setActiveListings(active)
            setSoldListings(sold)
            setFlats(flatsData || [])
            setLoading(false)
        }

        fetchData()
    }, [router, supabase])

    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>
    if (!profile) return null

    const hasActiveListings = activeListings.length > 0
    const hasSoldListings = soldListings.length > 0
    const hasFlats = flats.length > 0
    const hasContent = hasActiveListings || hasFlats || hasSoldListings

    return (
        <div className="pb-20">
            {/* Profile Header */}
            <div className="relative bg-gradient-to-b from-primary/10 via-primary/5 to-background p-4 md:p-6 space-y-6 border-b border-border/50 overflow-hidden">
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/profile/edit" className="relative group">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Avatar className="h-20 w-20 border-2 border-primary relative transition-all group-hover:border-primary/60 group-hover:shadow-lg group-hover:shadow-primary/20">
                                <AvatarImage src={profile.avatar_url} />
                                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                                    {profile.alias_inst?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {/* Pencil Badge */}
                            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md border-2 border-background transition-all group-hover:scale-110 group-hover:shadow-lg">
                                <Pencil className="h-3 w-3" />
                            </div>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 max-w-[200px] md:max-w-none">
                                <h1 className="text-2xl font-bold truncate">@{profile.alias_inst}</h1>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <p className="text-sm text-muted-foreground">
                                    {getUniversityName(profile.uni || 'udc.es')}
                                </p>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
                                    <BadgeCheck className="h-3 w-3" />
                                    Verificado UDC
                                </Badge>
                                {profile.role === 'admin' && (
                                    <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs gap-1">
                                        <Shield className="h-3 w-3" />
                                        Admin
                                    </Badge>
                                )}
                                {profile.degree && profile.degree !== 'none' && (() => {
                                    const DegreeIcon = getDegreeIcon(profile.degree)
                                    return (
                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs gap-1">
                                            {DegreeIcon && <DegreeIcon className="h-3 w-3" />}
                                            {profile.degree}
                                        </Badge>
                                    )
                                })()}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                <span className="text-sm font-medium">
                                    {profile.rating_avg?.toFixed(1) || 'Nuevo'}
                                </span>
                                {profile.rating_count > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        ({profile.rating_count})
                                    </span>
                                )}
                            </div>
                            {profile.payment_methods && profile.payment_methods.length > 0 && (
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <CreditCard className="h-3 w-3 text-muted-foreground" />
                                    {profile.payment_methods.map((method: string) => (
                                        <Badge key={method} variant="outline" className="text-[10px] h-5 px-1.5 bg-background/50">
                                            {method}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 self-end md:self-auto mt-4 md:mt-0 flex-wrap animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {profile.role === 'admin' && (
                            <Link href="/admin">
                                <Button variant="outline" size="icon" className="hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20">
                                    <Shield className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                        <Link href="/profile/edit">
                            <Button variant="outline" size="icon" className="hover:bg-primary/10 hover:text-primary hover:border-primary/20">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </Link>
                        <LogoutButton />
                    </div>
                </div>
            </div>

            {
                profile.bio && (
                    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                    </div>
                )
            }

            {
                hasContent && (
                    <div className="flex gap-6 text-sm justify-center pt-2">
                        {hasActiveListings && (
                            <div className="text-center">
                                <div className="font-bold text-lg">{activeListings.length}</div>
                                <div className="text-muted-foreground text-xs">Activos</div>
                            </div>
                        )}
                        {hasSoldListings && (
                            <div className="text-center">
                                <div className="font-bold text-lg">{soldListings.length}</div>
                                <div className="text-muted-foreground text-xs">Vendidos</div>
                            </div>
                        )}
                        {hasFlats && (
                            <div className="text-center">
                                <div className="font-bold text-lg">{flats.length}</div>
                                <div className="text-muted-foreground text-xs">Pisos</div>
                            </div>
                        )}
                    </div>
                )
            }


            {/* Tabs - Only show if user has content */}
            {
                hasContent ? (
                    <ProfileTabs
                        activeListings={activeListings}
                        soldListings={soldListings}
                        flats={flats}
                        profile={profile}
                        currentUserId={profile.id}
                    />
                ) : (
                    <div className="p-4 text-center py-12 text-muted-foreground">
                        <p className="mb-4">No tienes anuncios ni pisos publicados todavía</p>
                        <div className="flex gap-2 justify-center">
                            <Link href="/market/new">
                                <Button variant="outline" size="sm">
                                    <Package className="h-4 w-4 mr-2" />
                                    Publicar Anuncio
                                </Button>
                            </Link>
                            <Link href="/flats/new">
                                <Button variant="outline" size="sm">
                                    <Home className="h-4 w-4 mr-2" />
                                    Publicar Piso
                                </Button>
                            </Link>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
