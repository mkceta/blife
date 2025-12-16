'use client'

import { useEffect } from 'react'
import { markNotificationsAsReadByType } from '@/app/notifications/mark-read-helpers'

export function CommunityReadMarker() {
    useEffect(() => {
        // Ejecutar en background sin bloquear la UI
        markNotificationsAsReadByType('comment').catch(console.error)
    }, [])

    return null
}
