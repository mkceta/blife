'use client'

import { MessageCircle, Heart, MessageSquare, ShoppingBag, Star } from 'lucide-react'
import { formatRelativeTime } from '@/lib/format'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSupabase } from '@/hooks/use-supabase'
import { memo, useCallback, useMemo } from 'react'

interface NotificationItemProps {
    notification: {
        id: string
        created_at: string
        type: string
        title: string
        message: string
        link: string | null
        read: boolean
    }
    onClose?: () => void
}

export const NotificationItem = memo(function NotificationItem({ notification, onClose }: NotificationItemProps) {
    const router = useRouter()
    const supabase = useSupabase()

    const icon = useMemo(() => {
        switch (notification.type) {
            case 'comment':
                return <MessageCircle className="h-5 w-5 text-blue-500" />
            case 'reaction':
                return <Heart className="h-5 w-5 text-pink-500" />
            case 'message':
                return <MessageSquare className="h-5 w-5 text-green-500" />
            case 'favorite':
                return <Star className="h-5 w-5 text-yellow-500" />
            case 'listing_sold':
                return <ShoppingBag className="h-5 w-5 text-purple-500" />
            default:
                return <MessageCircle className="h-5 w-5 text-muted-foreground" />
        }
    }, [notification.type])

    const handleClick = useCallback(async () => {
        // Mark as read
        if (!notification.read) {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    await supabase
                        .from('notifications')
                        .update({ read: true })
                        .eq('id', notification.id)
                        .eq('user_id', user.id)

                    // Ideally we should update the UI state here or revalidate
                    router.refresh()
                }
            } catch (error) {
                console.error('Error marking notification as read:', error)
            }
        }

        // Navigate to link if exists
        if (notification.link) {
            router.push(notification.link)
        }

        // Close dropdown
        onClose?.()
    }, [notification.id, notification.read, notification.link, router, supabase, onClose])

    return (
        <button
            onClick={handleClick}
            className={cn(
                "w-full p-4 text-left hover:bg-muted/50 transition-colors flex gap-3 items-start",
                !notification.read && "bg-primary/5"
            )}
        >
            <div className="flex-shrink-0 mt-0.5">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{notification.title}</p>
                    {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(notification.created_at)}
                </p>
            </div>
        </button>
    )
})

