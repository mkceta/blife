'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

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
            {threads.map((thread) => {
                const otherUser = thread.buyer_id === currentUserId ? thread.seller : thread.buyer
                const item = thread.listing || thread.flat
                const itemImage = item?.photos?.[0]?.url
                const unreadCount = unreadCounts[thread.id] || 0
                const isSelected = selectedThreadId === thread.id

                // Check if online (last seen within 5 minutes)
                const isOnline = otherUser?.last_seen && new Date(otherUser.last_seen).getTime() > Date.now() - 5 * 60 * 1000

                return (
                    <Link
                        key={thread.id}
                        href={`/messages/chat?id=${thread.id}`}
                        onClick={() => handleThreadClick(thread.id)}
                        className={cn(
                            "relative block p-4 rounded-xl border transition-all hover:shadow-lg hover:-translate-y-1",
                            isSelected
                                ? "bg-primary/20 border-primary/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] scale-[1.02]"
                                : unreadCount > 0
                                    ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]"
                                    : "bg-card/80 backdrop-blur-sm border-white/5 hover:border-primary/20"
                        )}
                    >
                        {/* Badge for unread messages */}
                        {unreadCount > 0 && (
                            <div className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground border-2 border-background shadow-md animate-pulse-slow">
                                {unreadCount}
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar className={cn(
                                    "h-12 w-12 border transition-all",
                                    unreadCount > 0 ? "border-primary ring-2 ring-primary/20" : "border-white/10"
                                )}>
                                    <AvatarImage src={otherUser?.avatar_url || undefined} />
                                    <AvatarFallback>{otherUser?.alias_inst?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {isOnline ? (
                                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                                ) : (
                                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-gray-400 border-2 border-background" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <h3 className={cn(
                                            "truncate transition-all text-base",
                                            unreadCount > 0 ? "font-bold text-primary" : "font-semibold"
                                        )}>@{otherUser?.alias_inst}</h3>
                                        {otherUser?.last_seen && (
                                            <span className="text-xs text-muted-foreground">
                                                {isOnline
                                                    ? 'En línea'
                                                    : `Última vez: ${formatRelativeTime(otherUser.last_seen)}`}
                                            </span>
                                        )}
                                    </div>
                                    {/* Date removed as requested */}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    {itemImage && (
                                        <img src={itemImage} alt="" className="h-8 w-8 rounded object-cover bg-muted" />
                                    )}
                                    <p className={cn(
                                        "text-sm truncate transition-colors",
                                        unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                                    )}>
                                        {item?.title || 'Producto eliminado'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
