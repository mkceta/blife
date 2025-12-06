'use client'

import { useState, useEffect, Suspense } from 'react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { HomeTabsList } from '@/components/home/home-tabs-list'
import { FadeIn } from '@/components/ui/fade-in'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MarketSearchBar } from '@/components/home/market-feed'
import { FlatsSearchBar } from '@/components/home/flats-feed'

interface HomeClientProps {
    marketFeed: React.ReactNode
    flatsFeed: React.ReactNode
    initialTab: string
}

export function HomeClient({ marketFeed, flatsFeed, initialTab }: HomeClientProps) {
    const [activeTab, setActiveTab] = useState(initialTab)

    // Sync state with prop changes (when DesktopHeader navigates)
    useEffect(() => {
        setActiveTab(initialTab)
    }, [initialTab])

    // Update URL when state changes manually (e.g. clicking tabs on mobile)
    useEffect(() => {
        const url = new URL(window.location.href)
        const currentTab = url.searchParams.get('tab')
        if (currentTab !== activeTab) {
            url.searchParams.set('tab', activeTab)
            window.history.replaceState(null, '', url.toString())
        }
    }, [activeTab])

    return (
        <div className="pb-20 bg-gradient-to-b from-primary/10 via-primary/5 to-background min-h-screen">
            <div className="p-0 md:p-4 space-y-0 max-w-7xl mx-auto">
                <Tabs defaultValue={initialTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="md:hidden">
                        <HomeTabsList activeTab={activeTab} />
                    </div>

                    <div className="mt-0">
                        {activeTab === 'market' ? (
                            <div className="min-h-[50vh] outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Suspense fallback={null}>
                                    <MarketSearchBar />
                                </Suspense>
                                <FadeIn>
                                    {marketFeed}
                                </FadeIn>
                            </div>
                        ) : (
                            <div className="min-h-[50vh] outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Suspense fallback={null}>
                                    {/* Hide FlatsSearchBar on desktop as requested implicitly by Vinted design? 
                                         Actually user didn't ask to hide it, but Vinted has main search bar. 
                                         DesktopHeader search bar handles flats search ('Buscar pisos...').
                                         So we should HIDE FlatsSearchBar on Desktop too.
                                     */}
                                    <FlatsSearchBar flats={[]} />
                                </Suspense>
                                <FadeIn>
                                    {flatsFeed}
                                </FadeIn>
                            </div>
                        )}
                    </div>
                </Tabs>
            </div>

            {/* Floating Action Button (Mobile Only) */}
            <div className="md:hidden">
                <Link href={activeTab === 'market' ? '/market/new' : '/flats/new'} aria-label="Crear nueva publicación">
                    <Button
                        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-6 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 z-50 border-2 border-white/10"
                        size="icon"
                    >
                        <Plus className="h-8 w-8" strokeWidth={3} />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
