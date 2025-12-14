'use client'

import { HomeNav } from '@/components/home/home-nav'
import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProductFeedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="pb-20 bg-gradient-to-b from-primary/10 via-primary/5 to-background min-h-screen">
            <div className="p-0 md:p-4 space-y-0 max-w-7xl mx-auto">
                {/* Mobile Tabs / Nav */}
                <div className="md:hidden bg-background/95 backdrop-blur-md pt-safe sticky top-0 z-50">
                    <Suspense fallback={null}>
                        <HomeNav />
                    </Suspense>
                </div>

                <div className="mt-0 grid grid-cols-1 grid-rows-1">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={usePathname()?.includes('flats') ? 'flats' : 'market'}
                            initial={{
                                opacity: 0,
                                x: usePathname()?.includes('flats') ? 20 : -20,
                                scale: 0.95,
                                filter: 'brightness(0.9)'
                            }}
                            animate={{
                                opacity: 1,
                                x: 0,
                                scale: 1,
                                filter: 'brightness(1)'
                            }}
                            exit={{
                                opacity: 0,
                                x: usePathname()?.includes('flats') ? -20 : 20,
                                scale: 0.95,
                                filter: 'brightness(0.9)'
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="col-start-1 row-start-1 w-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

        </div>
    )
}
