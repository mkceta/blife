
'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronLeft, Share2, ShieldCheck, Heart, MoreVertical, ChevronRight, Eye } from 'lucide-react'
import { formatTimeAgo } from '@/lib/format'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { ListingStatusControls } from '@/components/market/listing-status-controls'
import { FavoriteButton } from '@/components/market/favorite-button'
import { ShareButton } from '@/components/market/share-button'
import { ListingMapWrapper } from '@/components/market/listing-map-wrapper'
import { RelatedListings } from '@/components/market/related-listings'
import { ProductActions } from '@/components/market/product-actions'
import { calculateTotalWithFees } from '@/lib/pricing'
import { useQuery } from '@tanstack/react-query'

export default function ListingDetailPage() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const router = useRouter()
    const supabase = createClient()
    const viewIncremented = useRef(false)

    // Fetch user with caching
    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            return user
        },
        staleTime: 1000 * 60 * 5,
    })

    // Fetch listing with caching
    const { data: listing, isPending } = useQuery({
        queryKey: ['listing', id],
        queryFn: async () => {
            if (!id) return null
            const { data, error } = await supabase
                .from('listings')
                .select('*, user:users!listings_user_id_fkey(*)')
                .eq('id', id)
                .single()

            if (error) throw error
            return data
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutes
        placeholderData: (previousData) => previousData,
    })

    // Fetch favorite status with caching
    const { data: isFavorite = false } = useQuery({
        queryKey: ['favorite', id, user?.id],
        queryFn: async () => {
            if (!id || !user) return false
            const { data } = await supabase
                .from('favorites')
                .select('*')
                .eq('listing_id', id)
                .eq('user_id', user.id)
                .single()
            return !!data
        },
        enabled: !!id && !!user,
        staleTime: 1000 * 30,
    })

    useEffect(() => {
        if (id && !viewIncremented.current) {
            viewIncremented.current = true
            supabase.rpc('increment_listing_views', { listing_id: id }).then(({ error }) => {
                if (error) console.error('Error incrementing views:', error)
            })
        }
    }, [id, supabase])

    if (!id) return <div>No ID provided</div>
    if (isPending) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
    if (!listing) return <div className="min-h-screen flex items-center justify-center">Listing not found</div>

    const photos = listing.photos as any[] || []
    const price = (listing.price_cents / 100).toFixed(2)
    const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
    const isOwner = user?.id === listing.user_id

    // Vinted Attribute Row Component
    const AttributeRow = ({ label, value, isLink = false }: { label: string, value: string | React.ReactNode, isLink?: boolean }) => (
        <div className="flex justify-between py-3 border-b border-border/40 last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-medium ${isLink ? 'text-primary' : 'text-foreground'}`}>{value}</span>
        </div>
    )

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-12">
            {/* Mobile Header (Floating Transparent) */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-2 pt-[calc(0.5rem+env(safe-area-inset-top))] pointer-events-none">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="pointer-events-auto rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 h-10 w-10">
                    <ChevronLeft className="h-6 w-6" />
                </Button>

                <div className="flex gap-2 pointer-events-auto">
                    <ShareButton
                        url={currentUrl}
                        title={listing.title}
                        variant="ghost"
                        className="rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 h-10 w-10 p-2"
                    />
                    {!isOwner && (
                        <FavoriteButton
                            listingId={id!}
                            initialIsFavorite={isFavorite}
                            favoritesCount={listing.favorites_count}
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 h-10 w-10"
                            showCount={false}
                        />
                    )}
                    {isOwner && (
                        <div className="rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 h-10 w-10 flex items-center justify-center">
                            <ListingStatusControls
                                listingId={listing.id}
                                listingTitle={listing.title}
                                currentStatus={listing.status}
                                currentUrl={currentUrl}
                                variant="ghost"
                                className="h-full w-full p-2 text-white hover:text-white hover:bg-transparent"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex h-16 items-center px-8 border-b sticky top-0 bg-background/95 backdrop-blur z-40">
                <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Volver
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShareButton url={currentUrl} title={listing.title} variant="ghost" size="sm" />
                        {!isOwner && <FavoriteButton listingId={id!} initialIsFavorite={isFavorite} favoritesCount={listing.favorites_count} variant="outline" size="sm" />}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 bg-background">

                    {/* Image Section */}
                    <div className="relative bg-muted">
                        <div className="aspect-[3/4] md:aspect-square relative w-full overflow-hidden">
                            {photos.length > 0 ? (
                                <Carousel className="w-full h-full [&_[data-slot=carousel-content]]:h-full">
                                    <CarouselContent className="h-full ml-0">
                                        {photos.map((photo, index) => (
                                            <CarouselItem key={index} className="pl-0 h-full w-full basis-full relative bg-black">
                                                <Image
                                                    src={photo.url}
                                                    alt={listing.title}
                                                    fill
                                                    className="object-contain"
                                                    priority={index === 0}
                                                />
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    {photos.length > 1 && (
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                                            {photos.map((_, idx) => (
                                                <div key={idx} className="h-1.5 w-1.5 rounded-full bg-white/50 data-[active=true]:bg-white" />
                                            ))}
                                        </div>
                                    )}
                                </Carousel>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    Sin imágenes
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="p-5 space-y-6 md:py-8">
                        <div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-xl font-medium text-foreground">{listing.title}</h1>
                                    <div className="text-2xl font-bold mt-1 text-foreground">{price} €</div>

                                    {/* Buyer Protection */}
                                    {/* Buyer Protection & Views */}
                                    <div className="flex flex-col gap-1.5 mt-2">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-muted-foreground">
                                                <span className="font-bold text-green-700">{(calculateTotalWithFees(listing.price_cents) / 100).toFixed(2)} €</span> con Protección al comprador
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                                            <Eye className="h-4 w-4 stroke-[2.5px]" />
                                            <span>{listing.views_count} visitas</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {listing.status !== 'active' && (
                                        <Badge variant={listing.status === 'sold' ? 'destructive' : 'secondary'}>
                                            {listing.status === 'sold' ? 'Vendido' : 'Reservado'}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Vinted Style Attributes */}
                        <div className="border-t border-b border-border/40">
                            {/* Attributes - Only show if present */}
                            {listing.brand && <AttributeRow label="Marca" value={listing.brand} isLink />}
                            {listing.size && <AttributeRow label="Talla" value={listing.size} />}
                            {listing.condition && <AttributeRow label="Estado" value={listing.condition} />}
                            <AttributeRow label="Subido" value={formatTimeAgo(listing.created_at)} />

                        </div>



                        <div className="h-px bg-border/40" />

                        {/* Description */}
                        <div>
                            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Descripción</h3>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>
                        </div>

                        {listing.location && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Share2 className="h-3 w-3" />
                                {listing.location.address || "Ubicación aproximada"}
                            </div>
                        )}

                        <div className="h-px bg-border/40" />

                        {/* User Card */}
                        <Link href={`/user/${listing.user?.alias_inst}`} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={listing.user?.avatar_url} />
                                    <AvatarFallback>{listing.user?.alias_inst?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-sm">@{listing.user?.alias_inst}</p>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <div className="flex text-yellow-500">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Star key={i} className={`h-3 w-3 ${i <= (listing.user?.rating_avg || 0) ? 'fill-current' : 'text-muted/30'}`} />
                                            ))}
                                        </div>
                                        <span className="ml-1">({listing.user?.rating_count || 0})</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                        </Link>

                        {/* Desktop Actions */}
                        {!isOwner && (
                            <div className="hidden md:block">
                                <ProductActions
                                    listingId={listing.id}
                                    sellerId={listing.user_id}
                                    currentUserId={user?.id}
                                    price={listing.price_cents / 100}
                                    isOwner={isOwner}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Items (Horizontal Scroll) */}
                <div className="p-5 md:p-0 mt-8 mb-24">
                    <h2 className="font-semibold text-lg mb-4">Artículos similares</h2>
                    <div className="overflow-x-auto pb-4 snap-x snap-mandatory">
                        <RelatedListings
                            currentListingId={listing.id}
                            category={listing.category}
                            currentUserId={user?.id}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Footer - Action Bar */}
            {!isOwner && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
                    <ProductActions
                        listingId={listing.id}
                        sellerId={listing.user_id}
                        currentUserId={user?.id}
                        price={listing.price_cents / 100}
                        isOwner={isOwner}
                    />
                </div>
            )}
        </div>
    )
}

function Star({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    )
}
