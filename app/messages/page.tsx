'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { MessageSquare } from 'lucide-react'
import { MessagesSidebar } from '@/components/messages/messages-sidebar'
// We'll need to fetch data directly here instead of using server-side data functions
// import { getThreads, getUnreadCounts } from './data' 

export default function MessagesPage() {
    const [threads, setThreads] = useState<any[]>([])
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const searchParams = useSearchParams()
    const query = searchParams.get('q') || ''
    const supabase = createClient()
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }
            setCurrentUserId(user.id)

            // Fetch threads
            // Logic adapted from getThreads
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

            const { data: threadsData, error } = await threadQuery

            if (error) {
                console.error('Error fetching threads:', error)
            } else {
                // Client-side filtering for search query if needed, or improve Supabase query
                // For now, simple client-side filter if query exists
                let filteredThreads = threadsData || []
                if (query) {
                    const lowerQuery = query.toLowerCase()
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
            // Logic adapted from getUnreadCounts
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

        fetchData()
    }, [router, supabase, query])

    if (loading) return <div className="h-full flex items-center justify-center">Cargando mensajes...</div>

    return (
        <>
            {/* Mobile: Show Sidebar (Thread List) */}
            <div className="md:hidden h-full">
                <MessagesSidebar
                    threads={threads}
                    currentUserId={currentUserId!}
                    unreadCounts={unreadCounts}
                    searchQuery={query}
                    className="h-full"
                />
            </div>

            {/* Desktop: Show Empty State (Sidebar is in layout) */}
            <div className="hidden md:flex flex-1 flex-col items-center justify-center h-full p-8 text-center">
                <div className="bg-primary/10 p-6 rounded-full mb-6 animate-pulse-slow">
                    <MessageSquare className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Tus Mensajes</h2>
                <p className="text-muted-foreground max-w-md">
                    Selecciona una conversación de la lista para ver los mensajes o contacta con un vendedor desde el mercadillo.
                </p>
            </div>
        </>
    )
}
