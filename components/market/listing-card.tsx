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
import { Package, Heart, MoreVertical, ShieldCheck } from 'lucide-react'
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
    brand?: string
    size?: string
    condition?: string
}

export function ListingCard({ listing, currentUserId, isFavorited, priority = false }: { listing: Listing; currentUserId?: string; isFavorited?: boolean; priority?: boolean }) {
    // Handle photos being null or empty
    const photos = listing.photos as any[] | null
    const cover = photos?.[0]?.thumb_url || photos?.[0]?.url
    const isOwner = currentUserId === listing.user_id
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleDelete = async () => {
        try {
            const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', listing.id)

            if (error) throw error

            toast.success('Anuncio eliminado')
            router.refresh()
        } catch (error) {
            console.error('Error deleting listing:', error)
            toast.error('Error al eliminar el anuncio')
        }
    }

    return (
        <div className="group relative flex flex-col gap-2">
            {/* Image Container */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted/30">
                <Link href={`/market/product?id=${listing.id}`} className="absolute inset-0 z-10 active-press">
                    <span className="sr-only">Ver {listing.title}</span>
                </Link>

                {cover ? (
                    <Image
                        src={cover}
                        alt={listing.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        priority={priority}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Package className="h-10 w-10 opacity-20" />
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute right-2 top-2 z-20">
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
                    <div className="absolute right-2 top-2 z-20">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm hover:bg-black/60 transition-colors active:scale-90">
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

                {listing.status === 'sold' && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                        <span className="rotate-[-12deg] border-2 border-white px-4 py-1 text-lg font-bold text-white tracking-widest uppercase">
                            Vendido
                        </span>
                    </div>
                )}

                {/* Tuyo Badge */}
                {isOwner && (
                    <Badge variant="secondary" className="absolute bottom-2 left-2 z-10 text-[10px] font-medium h-5 px-1.5 bg-black/50 text-white border-none backdrop-blur-sm pointer-events-none">
                        Tuyo
                    </Badge>
                )}
            </div>

            {/* Info Section (Below Image) */}
            <div className="flex flex-col gap-0.5 px-0.5 mt-2">
                {/* Desktop Vinted Style: No Avatar, Just Text info */}
                <div className="hidden md:block">
                    <Link
                        href={`/user/${listing.user?.alias_inst}`}
                        className="text-xs text-muted-foreground truncate hover:underline cursor-pointer inline-block"
                        onClick={(e) => e.stopPropagation()} // Although it's a link, good to be safe if nested inside div with click handler
                    >
                        {listing.user?.alias_inst || 'usuario'}
                    </Link>
                    <p className="text-xs text-muted-foreground/60 truncate">
                        {listing.size || 'M'} • {listing.condition || 'Muy bueno'}
                    </p>
                    <div className="flex flex-col mt-1">
                        <span className="text-sm font-bold text-foreground">
                            {(listing.price_cents / 100).toFixed(2)} €
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                            {listing.size || 'M'}
                        </span>
                    </div>
                </div>

                {/* Mobile Style (Keep existing) */}
                <div className="md:hidden">
                    <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-foreground leading-tight">
                            {(listing.price_cents / 100).toFixed(2)} €
                        </span>
                        <div className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">
                            {listing.size || 'M'}
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <p className="text-xs text-muted-foreground truncate font-medium">
                            {listing.brand || 'Zara'}
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
