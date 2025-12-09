'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { MessagesSidebar } from '@/components/messages/messages-sidebar'

export default function MessagesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [threads, setThreads] = useState<any[]>([])
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }
            setCurrentUserId(user.id)

            // Fetch threads
            const { data: threadsData } = await supabase
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

            setThreads(threadsData || [])

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
        }

        fetchData()
    }, [router, supabase])

    if (!currentUserId) return null // Or a loading spinner

    return (
        <div className="bg-background h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] overflow-hidden">
            <div className="max-w-7xl mx-auto h-full flex overflow-hidden">
                {/* Sidebar - Visible on mobile only if we are on the main list page (handled by page.tsx logic usually, but here we want it always visible on desktop) */}
                <div className="hidden md:block w-[350px] lg:w-[400px] shrink-0 h-full border-r border-border/50">
                    <MessagesSidebar
                        threads={threads}
                        currentUserId={currentUserId}
                        unreadCounts={unreadCounts}
                        className="h-full"
                    />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full min-w-0 relative bg-background/50 backdrop-blur-sm">
                    {children}
                </div>
            </div>
        </div>
    )
}
