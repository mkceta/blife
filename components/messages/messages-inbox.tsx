'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageSquare, Bell, Search } from 'lucide-react'
import { MessageList } from '@/components/messages/message-list'
import { NotificationList } from '@/components/notifications/notification-list'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { useNotifications } from '@/hooks/use-notifications'
import { mediumHaptic } from '@/lib/haptics'
import { motion, AnimatePresence } from 'framer-motion'

interface MessagesInboxProps {
    className?: string
    initialThreads?: any[]
    initialUnreadCounts?: Record<string, number>
    currentUserId?: string
}

function MessagesInboxContent({ className, initialThreads, initialUnreadCounts, currentUserId }: MessagesInboxProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Read 'tab' from URL properly, default to 'messages'
    const tabParam = searchParams.get('tab')
    const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (tabParam === 'notifications') {
            setActiveTab('notifications')
        } else if (tabParam === 'messages') {
            setActiveTab('messages')
        }
    }, [tabParam])

    // Update URL when tab changes without full reload
    const handleTabChange = (tab: 'messages' | 'notifications') => {
        mediumHaptic()
        setActiveTab(tab)
    }

    // Get unread counts
    const { notifications } = useNotifications()
    const unreadNotifications = notifications.filter(n => !n.read && n.type !== 'message').length
    const unreadMessages = notifications.filter(n => !n.read && n.type === 'message').length

    // Animation logic
    const direction = activeTab === 'notifications' ? 1 : -1

    const tabVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 20 : -20,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -20 : 20,
            opacity: 0,
        }),
    }

    return (
        <div className={cn("flex flex-col h-full bg-background border-r border-border/50", className)}>
            {/* Header with Tabs */}
            <div className="flex flex-col border-b border-border/50 bg-background pt-[calc(env(safe-area-inset-top)+0.5rem)] sticky top-0 z-30 flex-shrink-0">
                <div className="px-4 pb-2">
                    <h1 className="text-xl font-bold">Buzón</h1>
                </div>

                {/* Main Tabs: Mensajes | Notificaciones */}
                <div className="flex w-full px-2">
                    <button
                        onClick={() => handleTabChange('messages')}
                        className={cn(
                            "flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors relative",
                            activeTab === 'messages'
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Mensajes
                        {unreadMessages > 0 && (
                            <span className="ml-2 bg-destructive text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                {unreadMessages}
                            </span>
                        )}
                        {activeTab === 'messages' && (
                            <motion.span
                                layoutId="active-tab-indicator"
                                className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-t-full"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange('notifications')}
                        className={cn(
                            "flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors relative",
                            activeTab === 'notifications'
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Bell className="w-4 h-4 mr-2" />
                        Notificaciones
                        {unreadNotifications > 0 && (
                            <span className="ml-2 bg-destructive text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                {unreadNotifications}
                            </span>
                        )}
                        {activeTab === 'notifications' && (
                            <motion.span
                                layoutId="active-tab-indicator"
                                className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-t-full"
                            />
                        )}
                    </button>
                </div>
            </div>

            {/* Search Bar (Only for Messages) */}
            <AnimatePresence mode="popLayout">
                {activeTab === 'messages' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-background/50 backdrop-blur-sm border-b border-border/40 z-20 flex-shrink-0"
                    >
                        <div className="p-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar en mensajes..."
                                    className="pl-9 h-9 bg-muted/50 border-border/50 focus-visible:ring-1 rounded-full text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                    <motion.div
                        key={activeTab}
                        custom={direction}
                        variants={tabVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute inset-0 w-full h-full bg-background"
                    >
                        {activeTab === 'messages' ? (
                            <MessageList
                                searchQuery={searchQuery}
                                initialThreads={initialThreads}
                                initialUnreadCounts={initialUnreadCounts}
                                currentUserId={currentUserId}
                            />
                        ) : (
                            <NotificationList />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

export function MessagesInbox(props: MessagesInboxProps) {
    return <MessagesInboxContent {...props} />
}
