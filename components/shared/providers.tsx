'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useState, useEffect } from 'react'

import { usePresence } from '@/hooks/use-presence'

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 10, // 10 minutes
                gcTime: 1000 * 60 * 60 * 24, // 24 hours
                refetchOnWindowFocus: false,
                refetchOnReconnect: true,
                retry: 1,
            },
        },
    }))

    // Create persister for localStorage (only in browser)
    const [persister] = useState(() => {
        if (typeof window !== 'undefined') {
            return createSyncStoragePersister({
                storage: window.localStorage,
                key: 'BLIFE_QUERY_CACHE',
            })
        }
        return undefined
    })

    usePresence()

    // Use PersistQueryClientProvider if we have a persister (browser)
    if (persister) {
        return (
            <PersistQueryClientProvider
                client={queryClient}
                persistOptions={{
                    persister,
                    maxAge: 1000 * 60 * 60 * 24, // 24 hours
                    dehydrateOptions: {
                        shouldDehydrateQuery: (query) => {
                            // Only persist successful queries
                            return query.state.status === 'success'
                        },
                    },
                }}
            >
                {children}
            </PersistQueryClientProvider>
        )
    }

    // Fallback for SSR
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
