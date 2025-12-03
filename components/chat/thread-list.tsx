import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/format'

interface Thread {
    id: string
    last_message_at: string
    listing: {
        title: string
        photos: any[]
    }
    other_user: {
        alias_inst: string
        avatar_url: string
    }
}

export function ThreadList({ threads }: { threads: Thread[] }) {
    if (threads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                <p>No tienes mensajes aún.</p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-border">
            {threads.map((thread) => (
                <Link key={thread.id} href={`/messages/${thread.id}`} className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors">
                    <div className="relative">
                        <Avatar className="h-12 w-12 border border-border">
                            <AvatarImage src={thread.other_user.avatar_url} />
                            <AvatarFallback>{thread.other_user.alias_inst.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {thread.listing.photos?.[0] && (
                            <img
                                src={thread.listing.photos[0].thumb_url || thread.listing.photos[0].url}
                                alt=""
                                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-background object-cover bg-muted"
                            />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                            <h3 className="font-semibold text-sm truncate">@{thread.other_user.alias_inst}</h3>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                {formatRelativeTime(thread.last_message_at)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                            {thread.listing.title}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    )
}
