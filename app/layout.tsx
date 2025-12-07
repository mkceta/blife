import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { BottomNav } from '@/components/layout/bottom-nav'
import { DesktopHeader } from '@/components/layout/desktop-header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BLife - Universidad de Coruña',
  description: 'Marketplace y comunidad para estudiantes UDC',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

import { SwipeNavigator } from '@/components/layout/swipe-navigator'

// ... existing imports

import { PwaRegister } from '@/components/pwa-register'

// ... existing imports

import { Suspense } from 'react'

import { PresenceUpdater } from '@/components/presence-updater'
import { BackButtonHandler } from '@/components/back-button-handler'

// ... existing imports

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <PresenceUpdater />
        <PwaRegister />
        <BackButtonHandler />
        <Suspense>
          <DesktopHeader />
        </Suspense>
        <SwipeNavigator>
          {children}
        </SwipeNavigator>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  )
}
