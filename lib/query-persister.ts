'use client'

import { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { del, get, set } from 'idb-keyval'

/**
 * Creates an IndexedDB persister for React Query
 * This allows cache to persist across page reloads and app restarts
 */
export function createIDBPersister(idbValidKey: IDBValidKey = 'reactQuery'): Persister {
    return {
        persistClient: async (client: PersistedClient) => {
            try {
                await set(idbValidKey, client)
            } catch (error) {
                console.error('Error persisting query client:', error)
            }
        },
        restoreClient: async () => {
            try {
                return await get<PersistedClient>(idbValidKey)
            } catch (error) {
                console.error('Error restoring query client:', error)
                return undefined
            }
        },
        removeClient: async () => {
            try {
                await del(idbValidKey)
            } catch (error) {
                console.error('Error removing query client:', error)
            }
        },
    }
}
