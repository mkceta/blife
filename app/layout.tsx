import './globals.css'
import type { Metadata } from 'next'
import { Inter, Open_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { BottomNav } from '@/components/layout/bottom-nav'
import { DesktopHeader } from '@/components/layout/desktop-header'
import { ThemeProvider } from '@/components/theme-provider'
import { SwipeNavigator } from '@/components/layout/swipe-navigator'
import { PwaRegister } from '@/components/pwa-register'
import { Suspense } from 'react'
import { PresenceUpdater } from '@/components/presence-updater'
import { BackButtonHandler } from '@/components/back-button-handler'
import { NotificationHandler } from '@/components/notification-handler'
import Providers from '@/app/providers'
import { RoutePrefetcher } from '@/components/route-prefetcher'

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
      <body className={`${inter.className} ${openSans.variable}`}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={['light', 'dark', 'midnight', 'gold']}
          >
            <PresenceUpdater />
            <PwaRegister />
            <BackButtonHandler />
            <NotificationHandler />
            <RoutePrefetcher />
            <Suspense>
              <DesktopHeader />
            </Suspense>
            <SwipeNavigator>
              {children}
            </SwipeNavigator>
            <BottomNav />
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
