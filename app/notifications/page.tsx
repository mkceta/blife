'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to unified inbox
        router.replace('/messages?tab=notifications')
    }, [router])

    return (
        <div className="flex bg-background h-screen items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    )
}
