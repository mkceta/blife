'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { MessageSquare } from 'lucide-react'
import { ThreadList } from '@/components/messages/thread-list'
import { Button } from '@/components/ui/button'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { MessagesSkeleton } from '@/components/messages/messages-skeleton'
import { useQuery } from '@tanstack/react-query'

interface MessageListProps {
    searchQuery?: string
}

export function MessageList({ searchQuery = '' }: MessageListProps) {
    const router = useRouter()
    const supabase = createClient()
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Get current user with caching
    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            return user
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // Fetch threads with caching
    const { data: threadsData, isPending, error, refetch, isFetching } = useQuery({
        queryKey: ['message-threads', user?.id],
        queryFn: async () => {
            if (!user) return []

            const { data: threadsData, error: threadsError } = await supabase
                .from('threads')
                .select(`
                    *,
                    listing:listings(id, title, photos, price_cents, status, user_id),
                    flat:flats(id, title, photos, rent_cents, status, user_id),
                    messages!messages_thread_id_fkey(id, body, created_at, read, from_user),
                    buyer:users!threads_buyer_id_fkey(id, alias_inst, avatar_url),
                    seller:users!threads_seller_id_fkey(id, alias_inst, avatar_url)
                `)
                .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
                .order('updated_at', { ascending: false })

            if (threadsError) throw threadsError
            return threadsData || []
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // Keep cached for 5 minutes
        gcTime: 1000 * 60 * 10, // Keep in memory for 10 minutes
        placeholderData: (previousData) => previousData, // Keep old data while refetching
    })

    // Fetch unread counts with caching
    const { data: unreadCounts = {} } = useQuery({
        queryKey: ['unread-counts', user?.id],
        queryFn: async () => {
            if (!user) return {}

            const { data: unreadData } = await supabase
                .from('messages')
                .select('thread_id')
                .eq('read', false)
                .neq('from_user', user.id)

            const counts: Record<string, number> = {}
            unreadData?.forEach((msg: any) => {
                counts[msg.thread_id] = (counts[msg.thread_id] || 0) + 1
            })
            return counts
        },
        enabled: !!user,
        staleTime: 1000 * 30, // 30 seconds for unread counts
    })

    // Filter threads by search query
    const filteredThreads = threadsData?.filter((thread: any) => {
        if (!searchQuery || !user) return true
        const lowerQuery = searchQuery.toLowerCase()
        const otherUser = thread.buyer_id === user.id ? thread.seller : thread.buyer
        const itemName = thread.listing?.title || thread.flat?.title || ''
        return (
            otherUser?.alias_inst?.toLowerCase().includes(lowerQuery) ||
            itemName.toLowerCase().includes(lowerQuery)
        )
    }) || []
    // Only show skeleton on absolute first load (isPending = no data at all)
    if (isPending) return <MessagesSkeleton />

    if (error) return (
        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <p className="text-destructive mb-2">Error al cargar mensajes</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Reintentar
            </Button>
        </div>
    )

    if (filteredThreads.length === 0) {
        return (
            <PullToRefresh onRefresh={async () => { await refetch() }}>
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[50vh]">
                    <div className="bg-muted/50 p-6 rounded-full mb-4">
                        <MessageSquare className="h-10 w-10 opacity-50" />
                    </div>
                    <h3 className="font-semibold mb-1">Sin mensajes</h3>
                    <p className="text-sm max-w-[250px]">
                        Todavía no tienes conversaciones activas.
                    </p>
                </div>
            </PullToRefresh>
        )
    }

    return (
        <div className="flex-1 overflow-hidden h-full">
            <PullToRefresh onRefresh={async () => { await refetch() }} scrollContainerRef={scrollContainerRef}>
                <div
                    ref={scrollContainerRef}
                    className="h-full overflow-y-auto px-0 scrollbar-thin pb-20 md:pb-0"
                >
                    <ThreadList
                        initialThreads={filteredThreads}
                        currentUserId={user?.id!}
                        unreadCounts={unreadCounts}
                    />
                </div>
            </PullToRefresh>
        </div>
    )
}
