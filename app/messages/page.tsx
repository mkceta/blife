import { MessageSquare } from 'lucide-react'
import { MessagesInbox } from '@/features/messages/components/messages-inbox'

/**
 * Messages Page - Server Component
 * 
 * Static page with client components for interactivity
 * No server-side data fetching needed (MessagesInbox handles it)
 */
export default function MessagesPage() {
    return (
        <>
            {/* Mobile View: Full screen Unified Inbox */}
            {/* On desktop, the inbox is already in the layout sidebar, so we hide this */}
            <div className="md:hidden h-full w-full">
                <MessagesInbox className="h-full w-full border-none" />
            </div>

            {/* Desktop View: Empty State (Right side) */}
            {/* This is shown in the 'children' area of the layout on desktop */}
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
