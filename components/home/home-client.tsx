'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { HomeTabsList } from '@/components/home/home-tabs-list'
import { FadeIn } from '@/components/ui/fade-in'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface HomeClientProps {
    marketFeed: React.ReactNode
    flatsFeed: React.ReactNode
    initialTab: string
}

export function HomeClient({ marketFeed, flatsFeed, initialTab }: HomeClientProps) {
    const [activeTab, setActiveTab] = useState(initialTab)

    // Optional: Update URL without navigation for shareability
    useEffect(() => {
        const url = new URL(window.location.href)
        if (url.searchParams.get('tab') !== activeTab) {
            url.searchParams.set('tab', activeTab)
            window.history.replaceState(null, '', url.toString())
        }
    }, [activeTab])

    return (
        <div className="pb-20 bg-gradient-to-b from-primary/10 via-primary/5 to-background min-h-screen">
            <div className="p-4 space-y-0">
                <Tabs defaultValue={initialTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <HomeTabsList activeTab={activeTab} />

                    <TabsContent value="market" className="min-h-[50vh] outline-none">
                        <FadeIn>
                            {marketFeed}
                        </FadeIn>
                    </TabsContent>

                    <TabsContent value="flats" className="min-h-[50vh] outline-none">
                        <FadeIn>
                            {flatsFeed}
                        </FadeIn>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Floating Action Button */}
            <Link href={activeTab === 'market' ? '/market/new' : '/flats/new'} aria-label="Crear nueva publicación">
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
