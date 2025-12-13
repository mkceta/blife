// imports remain same
import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { MessageSquare } from 'lucide-react'
import { ThreadList } from '@/components/messages/thread-list'
import { Button } from '@/components/ui/button'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { MessagesSkeleton } from '@/components/messages/messages-skeleton'

interface MessageListProps {
    searchQuery?: string
    initialThreads?: any[]
    initialUnreadCounts?: Record<string, number>
    currentUserId?: string
}

export function MessageList({
    searchQuery = '',
    initialThreads,
    initialUnreadCounts,
    currentUserId: initialUserId
}: MessageListProps) {
    const [threads, setThreads] = useState<any[]>(initialThreads || [])
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(initialUnreadCounts || {})
    const [loading, setLoading] = useState(!initialThreads)
    const [error, setError] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(initialUserId || null)

    // Update state when initial props change (e.g. navigation)
    useEffect(() => {
        if (initialThreads) setThreads(initialThreads)
        if (initialUnreadCounts) setUnreadCounts(initialUnreadCounts)
        if (initialUserId) setCurrentUserId(initialUserId)
    }, [initialThreads, initialUnreadCounts, initialUserId])

    const router = useRouter()
    const supabase = createClient()
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const fetchData = async () => {
        // Only show full loading if we have no data
        if (threads.length === 0) setLoading(true)

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
            setThreads(threadsData || [])
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

    // Only fetch on mount if no initial data
    useEffect(() => {
        if (!initialThreads) {
            fetchData()
        } else if (!currentUserId) {
            // Ensure we have currentUserId even if threads passed (rare case if props passed correctly)
            supabase.auth.getUser().then(({ data }) => {
                if (data.user) setCurrentUserId(data.user.id)
            })
        }
    }, [])

    // Client-side filtering
    const filteredThreads = useMemo(() => {
        if (!searchQuery) return threads
        if (!currentUserId) return threads

        const lowerQuery = searchQuery.toLowerCase()
        return threads.filter((thread: any) => {
            const otherUser = thread.buyer_id === currentUserId ? thread.seller : thread.buyer
            const itemName = thread.listing?.title || thread.flat?.title || ''
            return (
                otherUser?.alias_inst?.toLowerCase().includes(lowerQuery) ||
                itemName.toLowerCase().includes(lowerQuery)
            )
        })
    }, [threads, searchQuery, currentUserId])

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

    if (filteredThreads.length === 0 && !loading) {
        // If we have threads but filtered list is empty -> Show "No results"
        // If we have NO threads at all -> Show "No messages"
        const isSearchEmpty = threads.length > 0 && searchQuery

        return (
            <PullToRefresh onRefresh={async () => { await fetchData() }}>
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[50vh]">
                    {isSearchEmpty ? (
                        <>
                            <Search className="h-10 w-10 opacity-50 mb-4" />
                            <h3 className="font-semibold mb-1">Sin resultados</h3>
                            <p className="text-sm">No se encontraron conversaciones.</p>
                        </>
                    ) : (
                        <>
                            <div className="bg-muted/50 p-6 rounded-full mb-4">
                                <MessageSquare className="h-10 w-10 opacity-50" />
                            </div>
                            <h3 className="font-semibold mb-1">Sin mensajes</h3>
                            <p className="text-sm max-w-[250px]">
                                Todavía no tienes conversaciones activas.
                            </p>
                        </>
                    )}
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
                        initialThreads={filteredThreads}
                        currentUserId={currentUserId!}
                        unreadCounts={unreadCounts}
                    />
                </div>
            </PullToRefresh>
        </div>
    )
}

// Add import for Search icon
import { Search } from 'lucide-react'
