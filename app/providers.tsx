'use client'

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useState } from 'react'
import { NotificationsProvider } from '@/components/providers/notifications-provider'
import { queryClient } from '@/lib/query-client'
import { createIDBPersister } from '@/lib/query-persister'
import { usePrefetchCriticalRoutes } from '@/hooks/use-prefetch'

function PrefetchWrapper({ children }: { children: React.ReactNode }) {
    // Prefetch de rutas críticas en idle time
    usePrefetchCriticalRoutes()
    return <>{children}</>
}

export default function Providers({ children }: { children: React.ReactNode }) {
    const [persister] = useState(() => {
        // Only create persister on client-side to avoid SSR errors
        if (typeof window !== 'undefined') {
            return createIDBPersister()
        }
        // Return a noop persister for SSR
        return {
            persistClient: async () => { },
            restoreClient: async () => undefined,
            removeClient: async () => { },
        }
    })

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: 1000 * 60 * 60 * 24, // 24 horas
                dehydrateOptions: {
                    shouldDehydrateQuery: (query) => {
                        // Solo persistir queries exitosas
                        return query.state.status === 'success'
                    },
                },
            }}
        >
            <NotificationsProvider>
                <PrefetchWrapper>
                    {children}
                </PrefetchWrapper>
            </NotificationsProvider>
        </PersistQueryClientProvider>
    )
}
