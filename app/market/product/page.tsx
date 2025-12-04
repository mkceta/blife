'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronLeft, Calendar, MapPin, ShieldCheck, Star, Share2, Flag, MoreVertical } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { ListingStatusControls } from '@/components/market/listing-status-controls'
import { FavoriteButton } from '@/components/market/favorite-button'
import { ShareButton } from '@/components/market/share-button'
import { ProductActions } from '@/components/market/product-actions'
import { Separator } from '@/components/ui/separator'
import { ListingMapWrapper } from '@/components/market/listing-map-wrapper'
import { RelatedListings } from '@/components/market/related-listings'

function ProductContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const router = useRouter()
    const [listing, setListing] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [isFavorite, setIsFavorite] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            if (!id) return

            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            const { data: listingData, error } = await supabase
                .from('listings')
                .select('*, user:users!listings_user_id_fkey(*)')
                .eq('id', id)
                .single()

            if (error || !listingData) {
                // Handle 404 or error
                console.error('Error fetching listing:', error)
                return
            }

            setListing(listingData)

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
    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    if (!listing) return <div className="min-h-screen flex items-center justify-center">Listing not found</div>

    const photos = listing.photos as any[] || []
    const price = (listing.price_cents / 100).toFixed(2)
    const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
    const isOwner = user?.id === listing.user_id

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-12">
            {/* Mobile Header (Floating) */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex justify-between items-center pointer-events-none">
                <Button asChild variant="secondary" size="icon" className="pointer-events-auto rounded-full h-10 w-10 bg-background/80 backdrop-blur-md border shadow-sm">
                    <Link href="/market">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>

                <div className="pointer-events-auto">
                    <ShareButton
                        url={currentUrl}
                        title={listing.title}
                        variant="secondary"
                        className="rounded-full h-10 w-10 bg-background/80 backdrop-blur-md border shadow-sm"
                    />
                </div>
            </div>

            {/* Desktop Header (Breadcrumbs) */}
            <div className="hidden md:flex h-16 items-center px-8 border-b sticky top-0 bg-background/80 backdrop-blur-md z-40">
                <div className="max-w-7xl mx-auto w-full flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/market" className="hover:text-foreground transition-colors">Marketplace</Link>
                    <ChevronLeft className="h-4 w-4 rotate-180" />
                    <span className="text-foreground font-medium truncate">{listing.title}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto md:px-8 md:py-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                    {/* Left Column: Images */}
                    <div className="md:col-span-7 lg:col-span-8 space-y-4">
                        {/* Mobile Carousel / Desktop Main Image */}
                        <div className="relative aspect-square md:aspect-[4/3] lg:aspect-[16/9] bg-muted md:rounded-3xl overflow-hidden shadow-sm border-b md:border">
                            {photos.length > 0 ? (
                                <Carousel className="w-full h-full [&_[data-slot=carousel-content]]:h-full">
                                    <CarouselContent className="-ml-0 h-full">
                                        {photos.map((photo, index) => (
                                            <CarouselItem key={index} className="pl-0 relative w-full h-full basis-full">
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        src={photo.url}
                                                        alt={listing.title}
                                                        fill
                                                        className="object-cover"
                                                        priority={index === 0}
                                                    />
                                                </div>
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
                                    <div className="flex flex-col items-center gap-2">
                                        <Image src="/placeholder.svg" width={48} height={48} alt="No image" className="opacity-20" />
                                        <p>Sin imágenes</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desktop Thumbnails Grid (Visible only on large screens if multiple photos) */}
                        {photos.length > 1 && (
                            <div className="hidden md:grid grid-cols-4 gap-4">
                                {photos.slice(0, 4).map((photo, index) => (
                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity">
                                        <Image
                                            src={photo.url}
                                            alt={`Thumbnail ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details */}
                    <div className="md:col-span-5 lg:col-span-4">
                        <div className="px-5 md:px-0 space-y-8 md:sticky md:top-24">

                            {/* Header Info */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold leading-tight">{listing.title}</h1>
                                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {formatDistanceToNow(new Date(listing.created_at), { locale: es })}
                                            </span>
                                            <span>•</span>
                                            <span>{listing.category}</span>
                                        </div>
                                    </div>
                                    {isOwner ? (
                                        <ListingStatusControls
                                            listingId={listing.id}
                                            listingTitle={listing.title}
                                            currentStatus={listing.status}
                                            currentUrl={currentUrl}
                                            variant="outline"
                                            className="h-10 w-10 rounded-full shrink-0"
                                        />
                                    ) : (
                                        user && (
                                            <FavoriteButton
                                                listingId={id!}
                                                initialIsFavorite={isFavorite}
                                                favoritesCount={listing.favorites_count}
                                                variant="outline"
                                                size="icon"
                                                className="h-10 w-10 rounded-full shrink-0"
                                                showCount={false}
                                            />
                                        )
                                    )}
                                </div>

                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-primary">{price}€</span>
                                    {listing.original_price && (
                                        <span className="text-xl text-muted-foreground line-through decoration-muted-foreground/50">
                                            {listing.original_price}€
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {listing.status === 'reserved' && (
                                        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20">
                                            Reservado
                                        </Badge>
                                    )}
                                    {listing.status === 'sold' && (
                                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20">
                                            Vendido
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Seller Info */}
                            <Link href={`/user/profile?alias=${listing.user.alias_inst}`} className="flex items-center gap-4 group p-4 rounded-2xl border bg-card hover:bg-accent/50 transition-colors">
                                <div className="relative">
                                    <Avatar className="h-12 w-12 border">
                                        <AvatarImage src={listing.user.avatar_url} />
                                        <AvatarFallback>{listing.user.alias_inst?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    {listing.user.last_seen && new Date(listing.user.last_seen).getTime() > Date.now() - 20 * 60 * 1000 && (
                                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold truncate">@{listing.user.alias_inst}</p>
                                        {listing.user.is_verified && (
                                            <ShieldCheck className="h-4 w-4 text-blue-400" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                                            <span>{listing.user.rating_avg || 'New'}</span>
                                        </div>
                                        <span>•</span>
                                        <span className="truncate">{listing.user.uni}</span>
                                    </div>
                                </div>
                                <ChevronLeft className="h-5 w-5 rotate-180 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Link>

                            {/* Description */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg">Descripción</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {listing.description}
                                </p>
                            </div>

                            {/* Location */}
                            {listing.location && (
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        Ubicación
                                    </h3>
                                    <ListingMapWrapper location={listing.location} />
                                </div>
                            )}

                            {/* Desktop Actions */}
                            {!isOwner && (
                                <div className="hidden md:block pt-4">
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
                </div>

                {/* Related Listings */}
                <div className="mt-12">
                    <RelatedListings
                        currentListingId={listing.id}
                        category={listing.category}
                        currentUserId={user?.id}
                    />
                </div>
            </div>

            {/* Mobile Bottom Action Bar */}
            {!isOwner && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t z-50 pb-safe">
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

export default function ListingDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ProductContent />
        </Suspense>
    )
}
