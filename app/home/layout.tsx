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
                <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-md pt-safe">
                    <Suspense fallback={null}>
                        <HomeNav />
                    </Suspense>
                </div>

                <div className="mt-0">
                    {children}
                </div>
            </div>

            {/* Floating Action Button logic for mobile is inside HomeClient in the old code.
                We need to restore it here or inside the specific pages? 
                Actually, putting it in Layout is efficient if it links dynamically.
            */}
            <FloatingActionButton />

        </div>
    )
}



function FloatingActionButton() {
    const pathname = usePathname()
    // Helper to determine link based on current sub-route
    const isMarket = pathname.includes('/market') || !pathname.includes('/flats')
    const href = isMarket ? '/market/new' : '/flats/new'

    return (
        <div className="md:hidden">
            <Link href={href} aria-label="Crear nueva publicación">
                <Button
                    className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-6 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 z-50 border-2 border-white/10"
                    size="icon"
                >
                    <Plus className="h-8 w-8" strokeWidth={3} />
                </Button>
            </Link>
        </div>
    )
}
