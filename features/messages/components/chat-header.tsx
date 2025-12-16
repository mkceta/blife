'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ExternalLink, MoreVertical, Euro, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { formatRelativeTime } from '@/lib/format'
import { SaleQRDialog } from '@/features/market/components/sale-qr-dialog'
import { EnterSaleCodeDialog } from '@/features/market/components/enter-sale-code-dialog'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MakeOfferDialog } from '@/features/market/components/make-offer-dialog'
import { toast } from 'sonner'
import type { User } from '@/lib/types'

interface ChatHeaderProps {
    otherUser: {
        id: string
        alias_inst: string
        avatar_url?: string | null
        last_seen?: string | null
    }
    item?: {
        id: string
        title: string
        price: string | null
        photo?: string | null
    } | null
    itemType?: 'market' | 'flats'
    thread: {
        id: string
        listing?: {
            user_id: string
            status: string
            price_cents?: number
        } | null
    }
    currentUser: User
}

export function ChatHeader({ otherUser: initialOtherUser, item, itemType, thread, currentUser }: ChatHeaderProps) {
    const [otherUser, setOtherUser] = useState(initialOtherUser)
    const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel(`user-presence-${otherUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${otherUser.id}`
                },
                (payload: { new: { last_seen?: string } }) => {
                    const updatedUser = payload.new
                    setOtherUser((prev) => ({
                        ...prev,
                        last_seen: updatedUser.last_seen
                    }))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [otherUser.id, supabase])

    useEffect(() => {
        setOtherUser(initialOtherUser)
    }, [initialOtherUser])

    const isOnline = otherUser?.last_seen && new Date(otherUser.last_seen).getTime() > Date.now() - 5 * 60 * 1000
    const isOwner = thread.listing?.user_id === currentUser.id
    const isActive = thread.listing?.status === 'active'

    const handleBuy = () => {
        toast.info('Compra directa próximamente')
    }

    return (
        <div className="flex flex-col border-b border-border/50 bg-background/95 backdrop-blur-md z-10 w-full shadow-sm pt-safe">
            {/* Row 1: User Info & Navigation */}
            <div className="flex items-center p-2 gap-3">
                <Link href="/messages" className="md:hidden">
                    <Button variant="ghost" size="icon" className="-ml-1 rounded-full hover:bg-muted">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>

                <Link href={`/user/@${otherUser?.alias_inst}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                    <div className="relative">
                        <Avatar className="h-10 w-10 border border-border group-hover:border-primary/50 transition-colors">
                            <AvatarImage src={otherUser?.avatar_url || undefined} />
                            <AvatarFallback>{otherUser?.alias_inst?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {isOnline && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-sm leading-none truncate group-hover:text-primary transition-colors">
                            @{otherUser?.alias_inst}
                        </h2>
                        <p className={cn(
                            "text-xs mt-1 truncate",
                            isOnline ? "text-green-500 font-medium" : "text-muted-foreground"
                        )}>
                            {isOnline ? 'En línea' : formatRelativeTime(otherUser?.last_seen || '')}
                        </p>
                    </div>
                </Link>

                <div className="flex items-center gap-1">
                    {/* Simplified Header Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/user/@${otherUser?.alias_inst}`}>
                                    Ver perfil
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Reportar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Row 2: Product Context (Vinted Style) */}
            {item && (
                <div className="flex items-center p-3 gap-3 bg-muted/30 border-t border-border/50">
                    <Link href={`/${itemType}/${item.id}`} className="relative h-12 w-12 rounded-md overflow-hidden bg-muted border border-border shrink-0">
                        {item.photo ? (
                            <Image src={item.photo} alt={item.title} fill className="object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-secondary">
                                <span className="text-xs text-muted-foreground">Img</span>
                            </div>
                        )}
                    </Link>

                    <div className="flex-1 min-w-0">
                        <Link href={`/${itemType}/${item.id}`} className="block">
                            <h3 className="text-sm font-medium truncate">{item.title}</h3>
                            <p className="text-sm font-bold text-foreground">{item.price}</p>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isOwner && isActive && itemType === 'market' && (
                            <>
                                <Button size="sm" variant="outline" onClick={() => setIsOfferDialogOpen(true)}>
                                    Oferta
                                </Button>
                                <Button size="sm" onClick={handleBuy}>
                                    Comprar
                                </Button>
                            </>
                        )}

                        {/* QR Code Actions for Owner/Buyer when Active */}
                        {itemType === 'market' && isOwner && isActive && (
                            <SaleQRDialog listingId={item.id} listingTitle={item.title} />
                        )}
                        {itemType === 'market' && !isOwner && isActive && (
                            <EnterSaleCodeDialog />
                        )}

                        {itemType === 'market' && thread.listing && (
                            <MakeOfferDialog
                                listingId={item.id}
                                threadId={thread.id}
                                currentPrice={(thread.listing.price_cents || 0) / 100}
                                isOpen={isOfferDialogOpen}
                                onOpenChange={setIsOfferDialogOpen}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
