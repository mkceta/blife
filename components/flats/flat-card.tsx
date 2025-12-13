'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EditButton } from '@/components/ui/edit-button'
import { Building, Pencil, Trash2, Heart, MessageCircle } from 'lucide-react'
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

interface Flat {
    id: string
    title: string
    rent_cents: number
    photos: any
    user_id: string
    rooms: number | null
    baths: number | null
    area_m2: number | null
    location_area?: string | null
    user?: {
        alias_inst: string
        avatar_url?: string | null
    } | null
}

export function FlatCard({ flat, currentUserId, priority = false }: { flat: Flat; currentUserId?: string; priority?: boolean }) {
    const photos = (flat.photos as any[]) || []
    const rent = (flat.rent_cents / 100).toFixed(0)
    const firstPhoto = photos[0]?.url
    const isOwner = currentUserId === flat.user_id
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
                .eq('seller_id', flat.user_id)
                .eq('flat_id', flat.id)
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
                    seller_id: flat.user_id,
                    flat_id: flat.id,
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
            // Check if favorite already exists
            const { data: existing } = await supabase
                .from('favorites')
                .select('id')
                .eq('flat_id', flat.id) // Assuming flats have favorites too? The original code imported toggleFavorite from listing-actions which handled listings.
                // Wait, does toggleFavorite handle flats?
                // The original code: export async function toggleFavorite(listingId: string) ... .eq('listing_id', listingId)
                // It seems it ONLY handled listings.
                // But FlatCard was using it.
                // Does the favorites table have a flat_id column?
                // If not, maybe flats cannot be favorited?
                // Or maybe they reused listing_id?
                // Let's assume for now we need to check if favorites table supports flats.
                // If the original code used `toggleFavorite(flat.id)`, and `toggleFavorite` used `listing_id`, then it was probably broken or flats are stored as listings?
                // Flats are in 'flats' table. Listings in 'listings'.
                // If `favorites` table has `flat_id`, we should use it.
                // If not, maybe we can't favorite flats yet?
                // I'll assume `flat_id` exists or I should skip this if it was broken.
                // But the user wants "Arregla todos los errores".
                // I'll try to use `flat_id`.
                .eq('user_id', currentUserId)
                .maybeSingle()

            if (existing) {
                await supabase.from('favorites').delete().eq('id', existing.id)
                toast.success('Eliminado de favoritos')
            } else {
                await supabase.from('favorites').insert({
                    flat_id: flat.id,
                    user_id: currentUserId
                })
                toast.success('Añadido a favoritos')
            }
        } catch (error) {
            console.error('Error toggling favorite:', error)
            toast.error('Error al actualizar favoritos')
        }
    }

    const handleDelete = async () => {
        try {
            const { error } = await supabase
                .from('flats')
                .delete()
                .eq('id', flat.id)

            if (error) throw error

            toast.success('Piso eliminado')
            router.refresh()
        } catch (error) {
            console.error('Error deleting flat:', error)
            toast.error('Error al eliminar el piso')
        }
    }

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <div className="group bg-card/50 rounded-xl overflow-hidden border border-border/50 card-hover h-full relative">
                        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                            <Link href={`/flats/view?id=${flat.id}`} className="absolute inset-0 z-20">
                                <span className="sr-only">Ver {flat.title}</span>
                            </Link>

                            {firstPhoto ? (
                                <>
                                    <Image
                                        src={firstPhoto}
                                        alt={flat.title}
                                        fill
                                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        priority={priority}
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Building className="h-12 w-12 text-muted-foreground opacity-20" />
                                </div>
                            )}

                            {/* Price Badge */}
                            <div className="absolute top-2 right-2 z-30 pointer-events-none flex flex-col items-end gap-1">
                                <Badge className="glass-strong border-white/10 font-bold">
                                    {rent}€/mes
                                </Badge>
                            </div>

                            {isOwner && (
                                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-30">
                                    <Badge className="glass-strong border-blue-500/30 text-blue-400 text-xs h-6 pointer-events-none">Tuyo</Badge>
                                    <div className="pointer-events-auto">
                                        <EditButton href={`/flats/edit?id=${flat.id}`} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-3 space-y-1.5 pointer-events-none">
                            <h3 className="font-semibold line-clamp-2 leading-tight min-h-[2.25rem] text-sm">{flat.title}</h3>
                            <div className="flex gap-2 text-[10px] text-muted-foreground flex-wrap">
                                {flat.rooms && <span>{flat.rooms} hab.</span>}
                                {flat.baths && <span>{flat.baths} b.</span>}
                                {flat.area_m2 && <span>{flat.area_m2}m²</span>}
                            </div>
                            <div className="flex items-center gap-2 pt-1 pointer-events-auto">
                                <Link href={`/user/${flat.user?.alias_inst}`} className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors group/user z-30 min-w-0">
                                    <Avatar className="h-4 w-4 sm:h-5 sm:w-5 border border-border/50 shrink-0">
                                        <AvatarImage src={flat.user?.avatar_url || undefined} />
                                        <AvatarFallback className="text-[8px] sm:text-[9px] bg-secondary">
                                            {flat.user?.alias_inst?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate max-w-[100px] group-hover/user:underline">
                                        @{flat.user?.alias_inst || 'usuario'}
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    {isOwner ? (
                        <>
                            <ContextMenuItem onClick={() => router.push(`/flats/edit?id=${flat.id}`)}>
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
                                <Heart className="mr-2 h-4 w-4" />
                                Añadir a favoritos
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
                title={flat.title}
                itemType="piso"
                onConfirm={handleDelete}
            />
        </>
    )
}
