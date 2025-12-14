'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ThreadListProps {
    initialThreads: any[]
    currentUserId: string
    unreadCounts: Record<string, number>
}

export function ThreadList({ initialThreads, currentUserId, unreadCounts: initialUnreadCounts }: ThreadListProps) {
    const [threads, setThreads] = useState(initialThreads)
    const [unreadCounts, setUnreadCounts] = useState(initialUnreadCounts)
    const supabase = createClient()

    useEffect(() => {
        setThreads(initialThreads)
    }, [initialThreads])

    useEffect(() => {
        setUnreadCounts(initialUnreadCounts)
    }, [initialUnreadCounts])

    useEffect(() => {
        const channel = supabase
            .channel('users-status-changes')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'users',
            }, (payload) => {
                const updatedUser = payload.new

                setThreads(currentThreads => currentThreads.map(thread => {
                    const isBuyer = thread.buyer_id === updatedUser.id
                    const isSeller = thread.seller_id === updatedUser.id

                    if (!isBuyer && !isSeller) return thread

                    // Create new objects to ensure state update triggers re-render
                    const newThread = { ...thread }

                    if (isBuyer) {
                        newThread.buyer = { ...thread.buyer, last_seen: updatedUser.last_seen }
                    }

                    if (isSeller) {
                        newThread.seller = { ...thread.seller, last_seen: updatedUser.last_seen }
                    }

                    return newThread
                }))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const handleThreadClick = (threadId: string) => {
        setUnreadCounts(prev => ({
            ...prev,
            [threadId]: 0
        }))
    }

    const params = useParams()
    const selectedThreadId = params?.id

    if (!threads || threads.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground glass-card rounded-xl p-8">
                <p>No tienes mensajes.</p>
                <p className="text-sm mt-2">Contacta con alguien del mercadillo o pisos para empezar.</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {threads.map((thread, index) => {
                const otherUser = thread.buyer_id === currentUserId ? thread.seller : thread.buyer
                const item = thread.listing || thread.flat
                const itemImage = item?.photos?.[0]?.url
                const unreadCount = unreadCounts[thread.id] || 0
                const isSelected = selectedThreadId === thread.id

                // Get latest message logic if available
                const latestMessage = thread.messages && thread.messages.length > 0
                    ? thread.messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                    : null

                const snippet = latestMessage ? latestMessage.body : (item?.title || 'Producto eliminado')

                // Check if online (last seen within 5 minutes)
                const isOnline = otherUser?.last_seen && new Date(otherUser.last_seen).getTime() > Date.now() - 5 * 60 * 1000

                return (
                    <motion.div
                        key={thread.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.01, 0.1) }}
                    >
                        <Link
                            href={`/messages/chat?id=${thread.id}`}
                            onClick={() => handleThreadClick(thread.id)}
                            className={cn(
                                "relative flex items-start gap-3 p-4 border-b border-border/40 hover:bg-muted/30 transition-colors",
                                isSelected && "bg-muted/50"
                            )}
                        >
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <Avatar className="h-12 w-12 border border-border/50">
                                    <AvatarImage src={otherUser?.avatar_url || undefined} />
                                    <AvatarFallback>{otherUser?.alias_inst?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive border-2 border-background" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Header: Name + Time */}
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <span className={cn(
                                        "font-medium truncate pr-2 text-[15px]",
                                        unreadCount > 0 ? "text-foreground font-bold" : "text-foreground"
                                    )}>
                                        {otherUser?.alias_inst}
                                    </span>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                        {latestMessage ? formatRelativeTime(latestMessage.created_at) : ''}
                                    </span>
                                </div>

                                {/* Body: Snippet + Product Image */}
                                <div className="flex gap-3 justify-between">
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <p className={cn(
                                            "text-sm truncate leading-snug",
                                            unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                                        )}>
                                            {snippet}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 truncate">
                                            {item?.title}
                                        </p>
                                        {item && 'price_cents' in item && (
                                            <p className="text-sm font-medium mt-0.5">
                                                {(item.price_cents / 100).toFixed(2)} €
                                            </p>
                                        )}
                                    </div>

                                    {itemImage && (
                                        <img
                                            src={itemImage}
                                            alt=""
                                            className="h-12 w-12 rounded-md object-cover bg-muted shrink-0 border border-border/50"
                                        />
                                    )}
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )
            })}
        </div>
    )
}
