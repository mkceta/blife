'use client'

import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { useRouter } from 'next/navigation'

export function useBackHandler() {
    const router = useRouter()

    useEffect(() => {
        const handleBack = async () => {
            App.addListener('backButton', ({ canGoBack }: any) => {
                if (canGoBack) {
                    window.history.back()
                } else {
                    App.exitApp()
                }
            })
        }

        handleBack()

        return () => {
            App.removeAllListeners()
        }
    }, [router])
}
