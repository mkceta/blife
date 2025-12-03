'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { NotificationItem } from '@/components/notifications/notification-item'
import { cn } from '@/lib/utils'

interface NotificationsTabsProps {
    allNotifications: any[]
    unreadNotifications: any[]
}

export function NotificationsTabs({ allNotifications, unreadNotifications }: NotificationsTabsProps) {
    const [activeTab, setActiveTab] = useState('all')
    const unreadCount = unreadNotifications?.length || 0

    return (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 relative glass-strong rounded-xl p-1">
                <TabsTrigger
                    value="all"
                    className="relative z-10 data-[state=active]:bg-transparent transition-colors duration-200"
                >
                    {activeTab === 'all' && (
                        <motion.div
                            layoutId="notifications-tab-indicator"
                            className="absolute inset-0 bg-background shadow-sm rounded-md"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className="relative z-10">
                        Todas {allNotifications?.length ? `(${allNotifications.length})` : ''}
                    </span>
                </TabsTrigger>
                <TabsTrigger
                    value="unread"
                    className="relative z-10 data-[state=active]:bg-transparent transition-colors duration-200"
                >
                    {activeTab === 'unread' && (
                        <motion.div
                            layoutId="notifications-tab-indicator"
                            className="absolute inset-0 bg-background shadow-sm rounded-md"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className="relative z-10">
                        No leídas {unreadCount > 0 ? `(${unreadCount})` : ''}
                    </span>
                </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
                {activeTab === 'all' && (
                    <TabsContent value="all" className="mt-4 outline-none" asChild>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {allNotifications && allNotifications.length > 0 ? (
                                <div className="bg-card rounded-xl border divide-y overflow-hidden">
                                    {allNotifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-muted-foreground">
                                    No tienes notificaciones
                                </div>
                            )}
                        </motion.div>
                    </TabsContent>
                )}

                {activeTab === 'unread' && (
                    <TabsContent value="unread" className="mt-4 outline-none" asChild>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {unreadNotifications && unreadNotifications.length > 0 ? (
                                <div className="bg-card rounded-xl border divide-y overflow-hidden">
                                    {unreadNotifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-muted-foreground">
                                    No tienes notificaciones sin leer
                                </div>
                            )}
                        </motion.div>
                    </TabsContent>
                )}
            </AnimatePresence>
        </Tabs>
    )
}
