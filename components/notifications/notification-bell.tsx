'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationItem } from '@/components/notifications/notification-item'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function NotificationBell() {
    const { notifications, unreadCount, loading } = useNotifications()
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const recentNotifications = notifications.slice(0, 5)

    const handleMarkAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase
                    .from('notifications')
                    .update({ read: true })
                    .eq('user_id', user.id)
                    .eq('read', false)

                router.refresh()
            }
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Notificaciones"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-medium animate-in zoom-in-50">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notificaciones</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs h-7"
                        >
                            Marcar todas como leídas
                        </Button>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            Cargando...
                        </div>
                    ) : recentNotifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No tienes notificaciones
                        </div>
                    ) : (
                        <div className="divide-y">
                            {recentNotifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onClose={() => setIsOpen(false)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {notifications.length > 5 && (
                    <div className="p-2 border-t">
                        <Link href="/notifications" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full text-sm">
                                Ver todas las notificaciones
                            </Button>
                        </Link>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
