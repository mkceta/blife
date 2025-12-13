'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/format'
import { EditButton } from '@/components/ui/edit-button'
import { WishlistButton } from './wishlist-button'
import { cn } from '@/lib/utils'
import { Package, Heart, MoreVertical, ShieldCheck, FlameKindling } from 'lucide-react'
import { useState } from 'react'
import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { calculateTotalWithFees } from '@/lib/pricing'
import { useQueryClient } from '@tanstack/react-query'

interface Listing {
    id: string
    title: string
    price_cents: number
    photos: any[]
    status: string
    created_at: string
    user_id: string
    user: {
        alias_inst: string
        rating_avg: number
        avatar_url?: string | null
    } | null
    favorites_count?: number
    views_count?: number
    brand?: string
    size?: string
    condition?: string
}

const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2) + ' €'
}

export function ListingCard({ listing, currentUserId, isFavorited, priority = false, averageLikes = 2 }: { listing: Listing; currentUserId?: string; isFavorited?: boolean; priority?: boolean; averageLikes?: number }) {
    // Handle photos being null or empty
    const photos = listing.photos as any[] | null
    const cover = photos?.[0]?.thumb_url || photos?.[0]?.url
    const isOwner = currentUserId === listing.user_id
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const router = useRouter()
    const supabase = createClient()
    const queryClient = useQueryClient()

    const handleDelete = async () => {
        // Optimistic UI
        setShowDeleteDialog(false)
        toast.success('Anuncio eliminado')

        // Snapshot
        const previousData = queryClient.getQueriesData({ queryKey: ['market-listings'] })

        // Update Cache
        queryClient.setQueriesData({ queryKey: ['market-listings'] }, (oldData: any) => {
            if (!oldData) return oldData
            if (Array.isArray(oldData)) {
                return oldData.filter((item: any) => item.id !== listing.id)
            }
            return oldData
        })

        try {
            const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', listing.id)

            if (error) throw error

            // router.refresh() 
        } catch (error) {
            console.error('Error deleting listing:', error)
            toast.error('Error al eliminar el anuncio')
            // Revert
            previousData.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data)
            })
        }
    }

    return (
        <div className="group relative flex flex-col gap-2 bg-card/40 p-2.5 rounded-xl border border-border/40 hover:bg-card/60 transition-colors duration-300">
            {/* Image Container */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted/30">
                <Link href={`/market/product?id=${listing.id}`} className="absolute inset-0 z-10 active-press">
                    <span className="sr-only">Ver {listing.title}</span>
                </Link>

                {cover ? (
                    <Image
                        src={cover}
                        alt={listing.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        priority={priority}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Package className="h-10 w-10 opacity-20" />
                    </div>
                )}

                {listing.status === 'sold' && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                        <span className="rotate-[-12deg] border-2 border-white px-4 py-1 text-lg font-bold text-white tracking-widest uppercase">
                            Vendido
                        </span>
                    </div>
                )}

                <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1 items-start">
                    {/* Hot Badge */}
                    {(listing.favorites_count || 0) > Math.max(averageLikes * 1.5, 2) && (
                        <Badge className="text-[10px] font-bold h-5 px-1.5 bg-orange-500 text-white border-none shadow-sm flex items-center gap-1 pointer-events-none">
                            <FlameKindling className="h-3 w-3" />
                            Popular
                        </Badge>
                    )}
                    {/* Tuyo Badge */}
                    {isOwner && (
                        <Badge variant="secondary" className="text-[10px] font-medium h-5 px-1.5 bg-black/50 text-white border-none backdrop-blur-sm pointer-events-none">
                            Tuyo
                        </Badge>
                    )}
                </div>
            </div>

            {/* Overlays (Moved out to avoid overflow clipping) */}
            <div className="absolute right-4 top-4 z-30">
                {!isOwner && currentUserId ? (
                    <div onClick={(e) => e.preventDefault()}> {/* Prevent Link click */}
                        <WishlistButton
                            listingId={listing.id}
                            isFavorited={isFavorited || false}
                            favoritesCount={listing.favorites_count}
                            currentUserId={currentUserId}
                            variant="icon"
                        />
                    </div>
                ) : null}
            </div>

            {/* Owner Actions (Three dots or Edit) */}
            {isOwner && (
                <div className="absolute right-4 top-4 z-30">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="h-9 w-9 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-black/60 hover:border-white/30 hover:scale-105 transition-all duration-200">
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/market/edit?id=${listing.id}`)}>
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            {/* Info Section (Below Image) */}
            <div className="flex flex-col gap-0.5 px-0.5 mt-2">
                {/* Desktop Vinted Style: No Avatar, Just Text info */}
                <div className="hidden md:block">
                    <div className="flex items-center gap-2 mb-1">
                        <Link href={`/user/${listing.user?.alias_inst}`} onClick={(e) => e.stopPropagation()}>
                            <Avatar className="h-5 w-5 border border-border/10 cursor-pointer">
                                <AvatarImage src={listing.user?.avatar_url || undefined} alt={listing.user?.alias_inst} />
                                <AvatarFallback className="text-[9px]">{listing.user?.alias_inst?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <Link
                            href={`/user/${listing.user?.alias_inst}`}
                            className="text-xs text-muted-foreground truncate hover:underline cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {listing.user?.alias_inst || 'usuario'}
                        </Link>
                    </div>

                    <p className="text-sm text-foreground truncate font-medium mb-0.5">
                        {listing.title}
                    </p>

                    <p className="text-xs text-muted-foreground/60 truncate h-4">
                        {[listing.size, listing.condition].filter(Boolean).join(' • ')}
                    </p>
                    <div className="flex flex-col mt-1">
                        <span className="text-sm font-bold text-foreground">
                            {formatPrice(listing.price_cents)}
                        </span>
                        <div className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-green-600" />
                            <span className="text-[10px] items-center gap-1 font-semibold text-green-700">
                                {formatPrice(calculateTotalWithFees(listing.price_cents))}
                            </span>
                        </div>

                    </div>
                </div>

                {/* Mobile Style */}
                <div className="md:hidden">
                    <p className="text-xs text-foreground truncate font-medium mb-1">
                        {listing.title}
                    </p>
                    <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-foreground leading-tight">
                            {formatPrice(listing.price_cents)}
                        </span>
                        <div className="flex items-center gap-0.5 mt-0.5">
                            <ShieldCheck className="h-2.5 w-2.5 text-green-600" />
                            <span className="text-[10px] font-semibold text-green-700 leading-none">
                                {formatPrice(calculateTotalWithFees(listing.price_cents))}
                            </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">
                            {listing.size}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        {/* Added Avatar for Mobile too as per 'photo in listing card' request which likely implies everywhere */}
                        {listing.user?.avatar_url && (
                            <Avatar className="h-4 w-4 border border-border/10">
                                <AvatarImage src={listing.user.avatar_url} />
                                <AvatarFallback className="text-[8px]">{listing.user.alias_inst?.slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        )}
                        <p className="text-xs text-muted-foreground truncate font-medium h-4 leading-4">
                            {listing.brand || 'Varios'}
                        </p>
                    </div>
                </div>
            </div>

            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title={listing.title}
                itemType="anuncio"
                onConfirm={handleDelete}
            />
        </div>
    )
}
