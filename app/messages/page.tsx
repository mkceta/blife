import { MessageSquare } from 'lucide-react'
import { MessagesInbox } from '@/components/messages/messages-inbox'
import { getThreads, getUnreadCounts } from '@/lib/messages-data'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
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
        <>
            {/* Mobile View: Full screen Unified Inbox */}
            {/* On desktop, the inbox is already in the layout sidebar (part of layout, not page), so we check if this structure is correct.
                Actually, page.tsx IS the children of the layout.
                In 'app/messages/layout.tsx', usually there is a sidebar.
                If I look at 'app/messages/page.tsx' content (Step 322),
                it renders MessagesInbox for mobile (md:hidden).
                And Empty State for desktop (hidden md:flex).
                
                This means on Desktop, the 'MessagesInbox' is rendered by 'layout.tsx' probably?
                Let's double check 'app/messages/layout.tsx' if possible.
                Yes, Step 319 listed it.
                If layout renders the sidebar, then page renders the main content.
                If page renders 'MessagesInbox' on mobile, it means layout DOES NOT render sidebar on mobile.
                
                So my change to inject data into MessagesInbox in page.tsx ONLY affects mobile.
                What about Desktop sidebar?
                If Desktop sidebar is in layout.tsx, I need to fetch data there too?
                Layouts can be async server components too.
            */}
            <div className="md:hidden h-full w-full">
                <MessagesInbox
                    className="h-full w-full border-none"
                    initialThreads={threads}
                    initialUnreadCounts={unreadCounts}
                    currentUserId={user?.id}
                />
            </div>

            {/* Desktop View: Empty State (Right side) */}
            <div className="hidden md:flex flex-1 flex-col items-center justify-center h-full p-8 text-center bg-muted/10">
                <div className="bg-primary/10 p-6 rounded-full mb-6 animate-pulse-slow">
                    <MessageSquare className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Tus Mensajes</h2>
                <p className="text-muted-foreground max-w-md">
                    Selecciona una conversación de la lista para ver los mensajes.
                </p>
                <div className="mt-8 text-sm text-muted-foreground p-4 bg-background/50 rounded-lg border border-border/50 max-w-sm">
                    💡 <strong>Tip:</strong> Puedes ver tus notificaciones en la pestaña "Notificaciones" del panel izquierdo.
                </div>
            </div>
        </>
    )
}
