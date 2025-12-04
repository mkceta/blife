import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { BottomNav } from '@/components/layout/bottom-nav'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <SwipeNavigator>
          {children}
        </SwipeNavigator>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  )
}
