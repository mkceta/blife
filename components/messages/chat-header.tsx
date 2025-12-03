'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { formatRelativeTime } from '@/lib/format'
import { SaleQRDialog } from '@/components/market/sale-qr-dialog'
import { EnterSaleCodeDialog } from '@/components/market/enter-sale-code-dialog'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Euro } from 'lucide-react'
import { MakeOfferDialog } from '@/components/market/make-offer-dialog'

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
    } | null
    itemType?: 'market' | 'flats'
    thread: any
    currentUser: any
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
                (payload) => {
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

    return (
        <PageHeader title="" className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-3 w-full">
                <Link href="/messages" className="md:hidden">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <Link href={`/user/@${otherUser?.alias_inst}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity min-w-0">
                    <div className="relative">
                        <Avatar className="h-10 w-10 border border-white/10 shrink-0">
                            <AvatarImage src={otherUser?.avatar_url || undefined} />
                            <AvatarFallback>{otherUser?.alias_inst?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {isOnline && (
                            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <h2 className="font-semibold text-lg leading-none truncate">@{otherUser?.alias_inst}</h2>
                        {item && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                {item.title} • {item.price}
                            </p>
                        )}
                        {otherUser?.last_seen && (
                            <p className={cn(
                                "text-xs mt-0.5 truncate",
                                isOnline ? "text-green-500 font-medium" : "text-muted-foreground/80"
                            )}>
                                {isOnline ? 'En línea' : `Última vez: ${formatRelativeTime(otherUser.last_seen)}`}
                            </p>
                        )}
                    </div>
                </Link>
                {item && (
                    <div className="flex gap-2 shrink-0">
                        {itemType === 'market' && thread.listing?.user_id === currentUser.id && thread.listing.status === 'active' && (
                            <SaleQRDialog listingId={item.id} listingTitle={item.title} />
                        )}
                        {itemType === 'market' && thread.listing?.user_id !== currentUser.id && thread.listing.status === 'active' && (
                            <EnterSaleCodeDialog />
                        )}
                        <Link href={`/${itemType}/${item.id}`}>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                                <ExternalLink className="h-5 w-5" />
                            </Button>
                        </Link>

                        {itemType === 'market' && thread.listing?.user_id !== currentUser.id && thread.listing.status === 'active' && (
                            <>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setIsOfferDialogOpen(true)}>
                                            <Euro className="mr-2 h-4 w-4" />
                                            Hacer contraoferta
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <MakeOfferDialog
                                    listingId={item.id}
                                    threadId={thread.id}
                                    currentPrice={thread.listing.price_cents / 100}
                                    isOpen={isOfferDialogOpen}
                                    onOpenChange={setIsOfferDialogOpen}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>
        </PageHeader>
    )
}
