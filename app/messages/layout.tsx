'use client'

import { MessagesInbox } from '@/features/messages/components/messages-inbox'

export default function MessagesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="bg-background h-[100dvh] md:h-[calc(100vh-4rem)] overflow-hidden">
            <div className="max-w-7xl mx-auto h-full flex overflow-hidden">
                {/* Desktop Sidebar: Unified Inbox (Mensajes + Notificaciones) */}
                <div className="hidden md:block w-[350px] lg:w-[400px] shrink-0 h-full border-r border-border/50">
                    <MessagesInbox className="h-full border-none" />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full min-w-0 relative bg-background/50 backdrop-blur-sm">
                    {children}
                </div>
            </div>
        </div>
    )
}
