'use client'

import { HomeNav } from '@/components/home/home-nav'
import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="pb-20 bg-gradient-to-b from-primary/10 via-primary/5 to-background min-h-screen">
            <div className="p-0 md:p-4 space-y-0 max-w-7xl mx-auto">
                {/* Mobile Tabs / Nav */}
                <div className="md:hidden bg-background/95 backdrop-blur-md pt-safe">
                    <Suspense fallback={null}>
                        <HomeNav />
                    </Suspense>
                </div>

                <div className="mt-0">
                    {children}
                </div>
            </div>

        </div>
    )
}
