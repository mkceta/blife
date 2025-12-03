'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronLeft, MapPin, Home, Bath, Maximize, MessageCircle } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { ContactButton } from '@/components/market/contact-button'
import { FlatStatusControls } from '@/components/flats/flat-status-controls'
import { Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ShareButton } from '@/components/market/share-button'
import { ReportButton } from '@/components/market/report-button'
import { FavoriteButton } from '@/components/market/favorite-button'
import FlatMap from '@/components/flats/flat-map-dynamic'

function FlatDetailContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const router = useRouter()
    const [flat, setFlat] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isFavorite, setIsFavorite] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            if (!id) return

            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)

            const { data: flatData, error } = await supabase
                .from('flats')
                .select('*, user:users!flats_user_id_fkey(*)')
                .eq('id', id)
                .single()

            if (error || !flatData) {
                console.error('Error fetching flat:', error)
                // Handle 404
                return
            }

            setFlat(flatData)

            if (user) {
                const { data: favorite } = await supabase
                    .from('favorites')
                    .select('*')
                    .eq('listing_id', id)
                    .eq('user_id', user.id)
                    .single()

                setIsFavorite(!!favorite)
            }

            setLoading(false)
        }

        fetchData()
    }, [id, supabase])

    if (!id) return <div>No ID provided</div>
    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando piso...</div>
    if (!flat) return <div className="min-h-screen flex items-center justify-center">Piso no encontrado</div>

    const photos = flat.photos as any[] || []
    const rent = (flat.rent_cents / 100).toFixed(0)
    const landlord = Array.isArray(flat.user) ? flat.user[0] : flat.user
    const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://blife-udc.vercel.app/flats/view?id=${id}`

    return (
        <div className="pb-24 bg-background min-h-screen">
            <div className="fixed top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <Button asChild variant="secondary" size="icon" className="pointer-events-auto rounded-full h-10 w-10 bg-black/50 hover:bg-black/70 border-none text-white">
                    <Link href="/flats">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <div className="flex gap-2 pointer-events-auto">
                    <ShareButton
                        url={currentUrl}
                        title={flat.title}
                        variant="secondary"
                        className="rounded-full h-10 w-10 bg-black/50 hover:bg-black/70 border-none text-white"
                    />
                    <ReportButton
                        targetType="flat"
                        targetId={flat.id}
                        variant="secondary"
                        className="rounded-full h-10 w-10 bg-black/50 hover:bg-black/70 border-none text-white"
                    />
                </div>
            </div>

            {/* Gallery */}
            <div className="relative aspect-[4/3] max-h-[500px] w-full bg-muted">
                {photos.length > 0 ? (
                    <Carousel className="w-full h-full">
                        <CarouselContent>
                            {photos.map((photo, index) => (
                                <CarouselItem key={index} className="relative aspect-[4/3] max-h-[500px]">
                                    <Image
                                        src={photo.url}
                                        alt={flat.title}
                                        fill
                                        className="object-contain"
                                        priority={index === 0}
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {photos.length > 1 && (
                            <>
                                <CarouselPrevious className="left-4" />
                                <CarouselNext className="right-4" />
                            </>
                        )}
                    </Carousel>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Home className="h-16 w-16" />
                    </div>
                )}
            </div>

            <div className="p-4 space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold leading-tight">{flat.title}</h1>
                        <span className="text-2xl font-bold text-primary whitespace-nowrap">{rent}€/mes</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{flat.location_area || 'A Coruña'}</span>
                        {flat.status === 'reserved' && (
                            <Badge variant="secondary" className="ml-2 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                Reservado
                            </Badge>
                        )}
                        {flat.status === 'sold' && (
                            <Badge variant="secondary" className="ml-2 bg-red-500/10 text-red-500 border-red-500/20">
                                Alquilado
                            </Badge>
                        )}
                    </div>
                    <div className="flex gap-4 text-sm">
                        {flat.rooms && (
                            <div className="flex items-center gap-1">
                                <Home className="h-4 w-4" />
                                <span>{flat.rooms} habitaciones</span>
                            </div>
                        )}
                        {flat.baths && (
                            <div className="flex items-center gap-1">
                                <Bath className="h-4 w-4" />
                                <span>{flat.baths} baños</span>
                            </div>
                        )}
                        {flat.area_m2 && (
                            <div className="flex items-center gap-1">
                                <Maximize className="h-4 w-4" />
                                <span>{flat.area_m2}m²</span>
                            </div>
                        )}
                    </div>
                    {flat.amenities && flat.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {flat.amenities.map((amenity: string) => (
                                <Badge key={amenity} variant="secondary" className="bg-secondary/50 hover:bg-secondary text-secondary-foreground border-secondary-foreground/10">
                                    {amenity === 'wifi' && 'WiFi / Internet'}
                                    {amenity === 'washing_machine' && 'Lavadora'}
                                    {amenity === 'dishwasher' && 'Lavavajillas'}
                                    {amenity === 'heating' && 'Calefacción'}
                                    {amenity === 'ac' && 'Aire Acondicionado'}
                                    {amenity === 'tv' && 'Televisión'}
                                    {amenity === 'elevator' && 'Ascensor'}
                                    {amenity === 'terrace' && 'Terraza / Balcón'}
                                    {amenity === 'oven' && 'Horno'}
                                    {amenity === 'microwave' && 'Microondas'}
                                    {amenity === 'dryer' && 'Secadora'}
                                    {amenity === 'garage' && 'Garaje'}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Link href={`/user/profile?alias=${landlord.alias_inst}`} className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                        <Avatar className="h-12 w-12 border border-border">
                            <AvatarImage src={landlord.avatar_url} />
                            <AvatarFallback>{landlord.alias_inst?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-medium">@{landlord.alias_inst}</p>
                            <p className="text-xs text-muted-foreground">★ {landlord.rating_avg || 'Nuevo'}</p>
                        </div>
                        <ChevronLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
                    </Link>

                    {currentUser?.id === flat.user_id ? (
                        <div className="flex gap-2">
                            <Button asChild variant="secondary" size="icon" className="rounded-full h-10 w-10 bg-black/50 hover:bg-black/70 border-none text-white">
                                <Link href={`/flats/edit/${flat.id}`}>
                                    <Edit className="h-5 w-5" />
                                </Link>
                            </Button>
                            <FlatStatusControls
                                flatId={flat.id}
                                flatTitle={flat.title}
                                currentStatus={flat.status}
                            />
                        </div>
                    ) : (
                        <ContactButton
                            itemId={flat.id}
                            itemType="flat"
                            sellerId={flat.user_id}
                            currentUserId={currentUser?.id}
                            size="icon"
                            variant="secondary"
                            className="rounded-xl h-14 w-14 bg-secondary/50 hover:bg-secondary border border-border shrink-0"
                        >
                            <MessageCircle className="h-6 w-6" />
                        </ContactButton>
                    )}
                </div>

                {flat.description && (
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Descripción</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {flat.description}
                        </p>
                    </div>
                )}

                {flat.roommates_current !== null && (
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Compañeros de piso</h3>
                        <p className="text-muted-foreground">
                            Actualmente hay {flat.roommates_current} persona(s) viviendo
                        </p>
                    </div>
                )}

                {(flat.lat && flat.lng) && (
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Ubicación</h3>
                        <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border">
                            <FlatMap
                                preciseLocation={{ lat: flat.lat, lng: flat.lng }}
                                interactive={false}
                                className="h-full w-full"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-20 pb-safe flex gap-3">
                {currentUser && (
                    <FavoriteButton
                        listingId={flat.id}
                        initialIsFavorite={isFavorite}
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full shrink-0"
                    />
                )}
                <ContactButton
                    itemId={flat.id}
                    itemType="flat"
                    sellerId={flat.user_id}
                    currentUserId={currentUser?.id}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20"
                />
            </div>
        </div>
    )
}

export default function FlatDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <FlatDetailContent />
        </Suspense>
    )
}
