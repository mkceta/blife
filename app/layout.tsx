import './globals.css'
import type { Metadata } from 'next'
import { Inter, Open_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { BottomNav } from '@/components/shared/bottom-nav'
import { DesktopHeader } from '@/components/shared/desktop-header'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { SwipeNavigator } from '@/components/shared/swipe-navigator'
import { PwaRegister } from '@/components/shared/pwa-register'
import { Suspense } from 'react'
import { PresenceUpdater } from '@/components/shared/presence-updater'
import { BackButtonHandler } from '@/components/shared/back-button-handler'
import { NotificationHandler } from '@/components/shared/notification-handler'
import Providers from '@/app/providers'
import { RoutePrefetcher } from '@/components/shared/route-prefetcher'
import { MainTransition } from '@/components/shared/main-transition'
import { CapacitorInitializer } from '@/components/shared/capacitor-initializer'
import { OfflineBanner } from '@/components/shared/offline-banner'
import { AggressivePrefetchInit } from '@/components/shared/aggressive-prefetch-init'

const inter = Inter({ subsets: ['latin'] })
export const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-open-sans'
})

export const metadata: Metadata = {
  title: 'BLife - Mercado y comunidad',
  description: 'Marketplace y comunidad para estudiantes UDC',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon',
    apple: '/icon',
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} ${openSans.variable}`} suppressHydrationWarning>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={['light', 'dark', 'midnight', 'gold']}
          >
            <PresenceUpdater />
            <CapacitorInitializer />
            <PwaRegister />
            <BackButtonHandler />
            <NotificationHandler />
            <RoutePrefetcher />
            <AggressivePrefetchInit />
            <OfflineBanner />
            <Suspense fallback={<div className="h-16" />}>
              <DesktopHeader />
            </Suspense>
            <SwipeNavigator>
              <MainTransition>
                {children}
              </MainTransition>
            </SwipeNavigator>
            <BottomNav />
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
