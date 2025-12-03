import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ThreadList } from './thread-list'

interface MessagesSidebarProps {
    threads: any[]
    currentUserId: string
    unreadCounts: Record<string, number>
    searchQuery?: string
    className?: string
}

export function MessagesSidebar({
    threads,
    currentUserId,
    unreadCounts,
    searchQuery,
    className
}: MessagesSidebarProps) {
    return (
        <div className={`flex flex-col h-full bg-card/30 border-r border-border/50 ${className}`}>
            <div className="p-4 border-b border-border/50 shrink-0">
                <h2 className="text-xl font-bold mb-4 px-1">Mensajes</h2>
                <form className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        name="q"
                        placeholder="Buscar chats..."
                        className="pl-9 bg-card/50 border-white/10 h-10"
                        defaultValue={searchQuery}
                    />
                </form>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                <ThreadList
                    initialThreads={threads}
                    currentUserId={currentUserId}
                    unreadCounts={unreadCounts}
                />
            </div>
        </div>
    )
}
