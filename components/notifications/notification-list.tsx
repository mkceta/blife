'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { NotificationItem } from '@/components/notifications/notification-item'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { cn } from '@/lib/utils'
import { MessagesSkeleton } from '@/components/messages/messages-skeleton'
import { motion } from 'framer-motion'

export function NotificationList() {
    const [allNotifications, setAllNotifications] = useState<any[]>([])
    const [unreadNotifications, setUnreadNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')
    const supabase = createClient()

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch all notifications
        const { data: all } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100)

        // Fetch unread notifications
        const { data: unread } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('read', false)
            .order('created_at', { ascending: false })

        setAllNotifications(all || [])
        setUnreadNotifications(unread || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [supabase])

    const handleMarkAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false)

        if (error) {
            toast.error('Error al marcar como leídas')
        } else {
            setUnreadNotifications([])
            setAllNotifications(prev => prev.map(n => ({ ...n, read: true })))
            toast.success('Todas marcadas como leídas')
        }
    }

    const unreadCount = unreadNotifications.length
    const displayedNotifications = activeFilter === 'all' ? allNotifications : unreadNotifications

    // We can reuse MessagesSkeleton as the structure is very similar (list of items with avatars/icons)
    if (loading) return <MessagesSkeleton />

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Filter Tabs (Sub-navigation) */}
            <div className="flex flex-col border-b border-border/50 bg-background sticky top-0 z-10">
                <div className="px-4 py-2 flex items-center justify-between">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={cn(
                                "text-sm font-medium transition-colors relative py-2",
                                activeFilter === 'all'
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Todas
                            {activeFilter === 'all' && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveFilter('unread')}
                            className={cn(
                                "text-sm font-medium transition-colors relative py-2",
                                activeFilter === 'unread'
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            No leídas
                            {unreadCount > 0 && <span className="ml-1.5 text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                            {activeFilter === 'unread' && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                            )}
                        </button>
                    </div>

                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs h-7 px-2 text-primary hover:text-primary hover:bg-primary/5">
                            <CheckCheck className="mr-1 h-3 w-3" />
                            Marcar leídas
                        </Button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-hidden relative">
                <PullToRefresh onRefresh={fetchData}>
                    <div className="h-full overflow-y-auto px-0 scrollbar-thin pb-20 md:pb-0">
                        {displayedNotifications.length > 0 ? (
                            <div className="divide-y divide-border/40">
                                {displayedNotifications.map((notification, index) => (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                                    >
                                        <NotificationItem
                                            notification={notification}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <div className="bg-muted/50 p-6 rounded-full mb-4">
                                    <Bell className="h-10 w-10 opacity-50" />
                                </div>
                                <p className="text-sm">{activeFilter === 'all' ? 'No tienes notificaciones' : 'Estás al día :)'}</p>
                            </div>
                        )}
                    </div>
                </PullToRefresh>
            </div>
        </div>
    )
}
