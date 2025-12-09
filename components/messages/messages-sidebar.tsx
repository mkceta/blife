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

import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useRef } from 'react'

export function MessagesSidebar({
    threads,
    currentUserId,
    unreadCounts,
    searchQuery,
    className
}: MessagesSidebarProps) {
    const router = useRouter()
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const handleRefresh = async () => {
        router.refresh()
    }

    return (
        <div className={`flex flex-col h-full bg-background border-r border-border/50 ${className}`}>
            <div className="flex flex-col border-b border-border/50 bg-background pt-safe">
                <div className="p-4 pb-2">
                    <h2 className="text-xl font-bold">Bandeja de entrada</h2>
                </div>
                <div className="flex px-4">
                    <button className="flex-1 pb-3 text-sm font-medium border-b-2 border-primary text-foreground">
                        Mensajes
                    </button>
                    <button
                        className="flex-1 pb-3 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => router.push('/notifications')}
                    >
                        Notificaciones
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <PullToRefresh onRefresh={handleRefresh} scrollContainerRef={scrollContainerRef}>
                    <div
                        ref={scrollContainerRef}
                        className="h-full overflow-y-auto p-2 scrollbar-thin pb-24"
                    >
                        <ThreadList
                            initialThreads={threads}
                            currentUserId={currentUserId}
                            unreadCounts={unreadCounts}
                        />
                    </div>
                </PullToRefresh>
            </div>
        </div>
    )
}
