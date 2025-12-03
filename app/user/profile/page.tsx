'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Star, Shield, BadgeCheck, GraduationCap, Building2, Briefcase, Stethoscope, Home, Dna, Scale, Baby, Users, Laptop, CreditCard } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getUniversityName } from '@/lib/format'
import { ProfileMessageButton } from '@/components/profile/profile-message-button'

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

function ProfileContent() {
    const searchParams = useSearchParams()
    const alias = searchParams.get('alias')
    const [profile, setProfile] = useState<any>(null)
    const [listings, setListings] = useState<any[]>([])
    const [flats, setFlats] = useState<any[]>([])
    const [posts, setPosts] = useState<any[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            if (!alias) return

            // Decode URL encoding (%40 -> @)
            const decodedUsername = decodeURIComponent(alias)

            // Remove @ symbol and domain (@username@udc -> username)
            let cleanUsername = decodedUsername.startsWith('@') ? decodedUsername.slice(1) : decodedUsername

            // Remove domain if present (username@udc -> username)
            if (cleanUsername.includes('@')) {
                cleanUsername = cleanUsername.split('@')[0]
            }

            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)

            // Get user by alias_inst
            const { data: profileData, error } = await supabase
                .from('users')
                .select('*')
                .eq('alias_inst', cleanUsername)
                .single()

            if (error || !profileData) {
                console.error('Error fetching profile:', error)
                setLoading(false)
                return
            }

            setProfile(profileData)

            // Get user's listings
            const { data: listingsData } = await supabase
                .from('listings')
                .select('*')
                .eq('user_id', profileData.id)
                .eq('is_hidden', false)
                .order('created_at', { ascending: false })

            if (listingsData) setListings(listingsData)

            // Get user's flats
            const { data: flatsData } = await supabase
                .from('flats')
                .select('*')
                .eq('user_id', profileData.id)
                .eq('is_hidden', false)
                .order('created_at', { ascending: false })

            if (flatsData) setFlats(flatsData)

            // Get user's posts
            const { data: postsData } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', profileData.id)
                .eq('is_hidden', false)
                .order('created_at', { ascending: false })

            if (postsData) setPosts(postsData)

            setLoading(false)
        }

        fetchData()
    }, [alias, supabase])

    if (!alias) return <div>No alias provided</div>
    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    if (!profile) return <div className="min-h-screen flex items-center justify-center">User not found</div>

    return (
        <div className="pb-20">
            {/* Profile Header */}
            <div className="bg-gradient-to-b from-primary/10 to-background p-6 space-y-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-2 border-primary">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="text-2xl">
                            {profile.alias_inst?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">@{profile.alias_inst}</h1>
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

                {profile.bio && (
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                )}

                <div className="flex gap-4 text-sm justify-center py-2">
                    <div className="text-center">
                        <div className="font-bold">{listings?.length || 0}</div>
                        <div className="text-muted-foreground">Ventas</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold">{flats?.length || 0}</div>
                        <div className="text-muted-foreground">Pisos</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold">{posts?.length || 0}</div>
                        <div className="text-muted-foreground">Posts</div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <ProfileMessageButton
                        sellerId={profile.id}
                        currentUserId={currentUser?.id}
                    />
                </div>
            </div>

            {/* Content Sections */}
            <div className="p-4 space-y-8">

                {/* Listings Section */}
                {listings && listings.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">En Venta</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {listings.map((listing) => (
                                <Link href={`/market/product?id=${listing.id}`} key={listing.id} className="block group">
                                    <div className="bg-card rounded-xl overflow-hidden border border-white/10 hover:border-primary/20 transition-all">
                                        <div className="aspect-video relative bg-muted">
                                            {listing.photos?.[0]?.url ? (
                                                <Image
                                                    src={listing.photos[0].url}
                                                    alt={listing.title}
                                                    fill
                                                    className="object-cover transition-transform group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    Sin foto
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white">
                                                {(listing.price_cents / 100).toFixed(0)}€
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-medium truncate">{listing.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-1">En venta</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Flats Section */}
                {flats && flats.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Pisos</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {flats.map((flat) => (
                                <Link href={`/flats/${flat.id}`} key={flat.id} className="block group">
                                    <div className="bg-card rounded-xl overflow-hidden border border-white/10 hover:border-primary/20 transition-all">
                                        <div className="aspect-video relative bg-muted">
                                            {flat.photos?.[0]?.url ? (
                                                <Image
                                                    src={flat.photos[0].url}
                                                    alt={flat.title}
                                                    fill
                                                    className="object-cover transition-transform group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    Sin foto
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white">
                                                {(flat.rent_cents / 100).toFixed(0)}€/mes
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-medium truncate">{flat.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-1">{flat.location_area}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Posts Section */}
                {posts && posts.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Publicaciones</h2>
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <div
                                    key={post.id}
                                    className="bg-card rounded-xl p-4 border border-white/10 space-y-2"
                                >
                                    <p className="text-sm whitespace-pre-wrap">{post.text}</p>
                                    {post.photo_url && (
                                        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                            <Image
                                                src={post.photo_url}
                                                alt="Post"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            {post.reactions_count || 0} reacciones
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(!listings?.length && !flats?.length && !posts?.length) && (
                    <div className="text-center py-12 text-muted-foreground">
                        Este usuario no tiene actividad pública.
                    </div>
                )}
            </div>
        </div>
    )
}

export default function PublicProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ProfileContent />
        </Suspense>
    )
}
