'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { NotificationItem } from '@/components/notifications/notification-item'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { cn } from '@/lib/utils'

export default function NotificationsPage() {
    const [allNotifications, setAllNotifications] = useState<any[]>([])
    const [unreadNotifications, setUnreadNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
    const router = useRouter()
    const supabase = createClient()

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login')
            return
        }

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
    }, [router, supabase])

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
    const displayedNotifications = activeTab === 'all' ? allNotifications : unreadNotifications

    if (loading) return <div className="h-full flex items-center justify-center">Cargando notificaciones...</div>

    return (
        <div className="flex flex-col h-full bg-background min-h-screen pb-20 md:pb-0">
            {/* Header matching Messages Sidebar */}
            <div className="flex flex-col border-b border-border/50 bg-background pt-[calc(env(safe-area-inset-top)+1rem)] sticky top-0 z-30">
                <div className="px-4 pb-2 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Notificaciones</h2>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs h-8 text-primary">
                            <CheckCheck className="mr-1 h-3 w-3" />
                            Marcar leídas
                        </Button>
                    )}
                </div>
                <div className="flex px-4">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={cn(
                            "flex-1 pb-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'all'
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setActiveTab('unread')}
                        className={cn(
                            "flex-1 pb-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'unread'
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        No leídas {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-hidden">
                <PullToRefresh onRefresh={fetchData}>
                    <div className="h-full overflow-y-auto px-0 scrollbar-thin">
                        {displayedNotifications.length > 0 ? (
                            <div className="divide-y divide-border/40">
                                {displayedNotifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Bell className="h-12 w-12 mb-4 opacity-20" />
                                <p>{activeTab === 'all' ? 'No tienes notificaciones' : 'No tienes notificaciones sin leer'}</p>
                            </div>
                        )}
                        <div className="h-24 md:h-0" /> {/* Spacer for bottom nav on mobile */}
                    </div>
                </PullToRefresh>
            </div>
        </div>
    )
}
