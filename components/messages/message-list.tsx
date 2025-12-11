'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { MessageSquare } from 'lucide-react'
import { ThreadList } from '@/components/messages/thread-list'
import { Button } from '@/components/ui/button'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { MessagesSkeleton } from '@/components/messages/messages-skeleton'

interface MessageListProps {
    searchQuery?: string
}

export function MessageList({ searchQuery = '' }: MessageListProps) {
    const [threads, setThreads] = useState<any[]>([])
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }
        setCurrentUserId(user.id)

        // Fetch threads
        let threadQuery = supabase
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

        const { data: threadsData, error: threadsError } = await threadQuery

        if (threadsError) {
            console.error('Error fetching threads:', threadsError)
            setError(threadsError.message)
        } else {
            let filteredThreads = threadsData || []
            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase()
                filteredThreads = filteredThreads.filter((thread: any) => {
                    const otherUser = thread.buyer_id === user.id ? thread.seller : thread.buyer
                    const itemName = thread.listing?.title || thread.flat?.title || ''
                    return (
                        otherUser?.alias_inst?.toLowerCase().includes(lowerQuery) ||
                        itemName.toLowerCase().includes(lowerQuery)
                    )
                })
            }
            setThreads(filteredThreads)
        }

        // Fetch unread counts
        const { data: unreadData } = await supabase
            .from('messages')
            .select('thread_id')
            .eq('read', false)
            .neq('from_user', user.id)

        const counts: Record<string, number> = {}
        unreadData?.forEach((msg: any) => {
            counts[msg.thread_id] = (counts[msg.thread_id] || 0) + 1
        })
        setUnreadCounts(counts)

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [supabase, searchQuery])

    if (loading) return <MessagesSkeleton />

    if (error) return (
        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <p className="text-destructive mb-2">Error al cargar mensajes</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Reintentar
            </Button>
        </div>
    )

    if (threads.length === 0) {
        return (
            <PullToRefresh onRefresh={async () => { await fetchData() }}>
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
            <PullToRefresh onRefresh={async () => { await fetchData() }} scrollContainerRef={scrollContainerRef}>
                <div
                    ref={scrollContainerRef}
                    className="h-full overflow-y-auto px-0 scrollbar-thin pb-20 md:pb-0"
                >
                    <ThreadList
                        initialThreads={threads}
                        currentUserId={currentUserId!}
                        unreadCounts={unreadCounts}
                    />
                </div>
            </PullToRefresh>
        </div>
    )
}
