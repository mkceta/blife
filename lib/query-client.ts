'use client'

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Aumentar staleTime para cache más agresivo
            staleTime: 1000 * 60 * 10, // 10 minutos por defecto
            gcTime: 1000 * 60 * 60 * 24, // 24 horas en cache
            refetchOnWindowFocus: false, // No refetch al cambiar de tab
            refetchOnReconnect: true, // Sí refetch al reconectar
            retry: 1, // Solo 1 retry para fallos
        },
    },
})
