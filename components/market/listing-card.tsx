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
import { Package, Pencil, Trash2, Heart, MessageCircle } from 'lucide-react'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useState } from 'react'
import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

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
}

export function ListingCard({ listing, currentUserId, isFavorited, priority = false }: { listing: Listing; currentUserId?: string; isFavorited?: boolean; priority?: boolean }) {
    // Handle photos being null or empty
    const photos = listing.photos as any[] | null
    const cover = photos?.[0]?.thumb_url || photos?.[0]?.url
    const isOwner = currentUserId === listing.user_id
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleContact = async () => {
        if (!currentUserId) {
            router.push('/auth/login')
            return
        }
        try {
            // Check if thread already exists
            const { data: existingThread } = await supabase
                .from('threads')
                .select('id')
                .eq('buyer_id', currentUserId)
                .eq('seller_id', listing.user_id)
                .eq('listing_id', listing.id)
                .maybeSingle()

            if (existingThread) {
                router.push(`/messages/chat?id=${existingThread.id}`)
                return
            }

            // Create new thread
            const { data: newThread, error } = await supabase
                .from('threads')
                .insert({
                    buyer_id: currentUserId,
                    seller_id: listing.user_id,
                    listing_id: listing.id,
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
        }
    }

    const handleFavorite = async () => {
        if (!currentUserId) {
            router.push('/auth/login')
            return
        }
        try {
            // Check if already favorited
            const { data: existing } = await supabase
                .from('favorites')
                .select('id')
                .eq('user_id', currentUserId)
                .eq('listing_id', listing.id)
                .maybeSingle()

            if (existing) {
                await supabase.from('favorites').delete().eq('id', existing.id)
                await (supabase as any).rpc('decrement_favorites', { listing_id: listing.id }).catch(() => { })
                toast.success('Eliminado de favoritos')
            } else {
                await supabase.from('favorites').insert({
                    user_id: currentUserId,
                    listing_id: listing.id
                })
                await (supabase as any).rpc('increment_favorites', { listing_id: listing.id }).catch(() => { })
                toast.success('Añadido a favoritos')
            }
            router.refresh()
        } catch (error) {
            console.error('Error toggling favorite:', error)
            toast.error('Error al actualizar favoritos')
        }
    }

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
        <>
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <Card className="overflow-hidden h-full border-border/50 bg-card/50 card-hover group relative">
                        <div className="aspect-square relative bg-muted overflow-hidden">
                            <Link href={`/market/product?id=${listing.id}`} className="absolute inset-0 z-20">
                                <span className="sr-only">Ver {listing.title}</span>
                            </Link>

                            {cover ? (
                                <>
                                    <Image
                                        src={cover}
                                        alt={listing.title}
                                        fill
                                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                        priority={priority}
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                    <Package className="h-12 w-12 mb-2 opacity-20" />
                                    <span className="text-xs">Sin imagen</span>
                                </div>
                            )}

                            {/* Wishlist Button - top left */}
                            {!isOwner && currentUserId && (
                                <div className="absolute top-2 left-2 z-30 pointer-events-auto">
                                    <WishlistButton
                                        listingId={listing.id}
                                        isFavorited={isFavorited || false}
                                        favoritesCount={listing.favorites_count}
                                        currentUserId={currentUserId}
                                    />
                                </div>
                            )}

                            {/* Price Badge - top right */}
                            <div className="absolute top-2 right-2 z-30 pointer-events-none">
                                <Badge className="glass-strong border-white/10 font-bold text-sm px-3 py-1">
                                    {(listing.price_cents / 100).toFixed(2)}€
                                </Badge>
                            </div>

                            {listing.status === 'sold' && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-25 pointer-events-none">
                                    <Badge variant="destructive" className="text-lg px-4 py-2 shadow-xl">VENDIDO</Badge>
                                </div>
                            )}

                            {isOwner && (
                                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-30">
                                    <Badge className="glass-strong border-blue-500/30 text-blue-400 text-xs h-6 pointer-events-none">Tuyo</Badge>
                                    <div className="pointer-events-auto">
                                        <EditButton href={`/market/edit?id=${listing.id}`} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <CardContent className="p-3 space-y-1.5">
                            <h3 className="font-semibold line-clamp-2 text-sm leading-tight min-h-[2.25rem] flex items-center">
                                {listing.title}
                            </h3>
                            <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground pt-1 gap-2">
                                <Link href={`/user/profile?alias=${listing.user?.alias_inst}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors group/user z-30 relative min-w-0 max-w-[65%]">
                                    <Avatar className="h-4 w-4 sm:h-5 sm:w-5 border border-border/50 shrink-0">
                                        <AvatarImage src={listing.user?.avatar_url || undefined} />
                                        <AvatarFallback className="text-[8px] sm:text-[9px] bg-secondary">
                                            {listing.user?.alias_inst?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate group-hover/user:underline">
                                        @{listing.user?.alias_inst || 'usuario'}
                                    </span>
                                </Link>
                                <span className="whitespace-nowrap shrink-0 text-[10px]">
                                    {formatRelativeTime(listing.created_at)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    {isOwner ? (
                        <>
                            <ContextMenuItem onClick={() => router.push(`/market/edit?id=${listing.id}`)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </ContextMenuItem>
                            <ContextMenuItem
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </ContextMenuItem>
                        </>
                    ) : (
                        <>
                            <ContextMenuItem onClick={handleFavorite}>
                                <Heart className={cn("mr-2 h-4 w-4", isFavorited && "fill-current text-primary")} />
                                {isFavorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                            </ContextMenuItem>
                            <ContextMenuItem onClick={handleContact}>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Contactar vendedor
                            </ContextMenuItem>
                        </>
                    )}
                </ContextMenuContent>
            </ContextMenu>

            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title={listing.title}
                itemType="anuncio"
                onConfirm={handleDelete}
            />
        </>
    )
}
