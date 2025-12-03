'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Bell } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { NotificationsTabs } from '@/components/notifications/notifications-tabs'
import { toast } from 'sonner'

export default function NotificationsPage() {
    const [allNotifications, setAllNotifications] = useState<any[]>([])
    const [unreadNotifications, setUnreadNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
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

    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando notificaciones...</div>

    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-2xl mx-auto p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <PageHeader title="Notificaciones" icon={<Bell className="h-5 w-5 text-primary" />} />
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                            Marcar todas como leídas
                        </Button>
                    )}
                </div>

                <NotificationsTabs
                    allNotifications={allNotifications}
                    unreadNotifications={unreadNotifications}
                />
            </div>
        </div>
    )
}
