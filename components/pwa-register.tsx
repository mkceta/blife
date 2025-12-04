'use client'

import { useEffect } from 'react'

export function PwaRegister() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(
                (registration) => {
                    console.log('Service Worker registration successful with scope: ', registration.scope)
                },
                (err) => {
                    console.log('Service Worker registration failed: ', err)
                }
            )
        }
    }, [])

    return null
}
