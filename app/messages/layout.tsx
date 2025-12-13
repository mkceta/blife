import { MessagesInbox } from '@/components/messages/messages-inbox'
import { getThreads, getUnreadCounts } from '@/lib/messages-data'
import { createClient } from '@/lib/supabase-server'

export default async function MessagesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let threads: any[] = []
    let unreadCounts = {}

    if (user) {
        const [threadsData, unreadCountsData] = await Promise.all([
            getThreads(),
            getUnreadCounts()
        ])
        threads = threadsData
        unreadCounts = unreadCountsData
    }

    return (
        <div className="bg-background h-[100dvh] md:h-[calc(100vh-4rem)] overflow-hidden">
            <div className="max-w-7xl mx-auto h-full flex overflow-hidden">
                {/* Desktop Sidebar: Unified Inbox (Mensajes + Notificaciones) */}
                <div className="hidden md:block w-[350px] lg:w-[400px] shrink-0 h-full border-r border-border/50">
                    <MessagesInbox
                        className="h-full border-none"
                        initialThreads={threads}
                        initialUnreadCounts={unreadCounts}
                        currentUserId={user?.id}
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
