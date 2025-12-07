'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useBackHandler } from '@/hooks/use-back-handler'

export function SwipeNavigator({ children }: { children: React.ReactNode }) {
    useBackHandler()

    // Swipe functionality disabled as per user request
    return (
        <div className="min-h-screen">
            {children}
        </div>
    )
}
