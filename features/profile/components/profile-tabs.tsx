'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Package, Star, Home, Grid3X3, MessageSquare } from 'lucide-react'
import { ListingCard } from '@/features/market/components/listing-card'
import { FlatCard } from '@/features/flats/components/flat-card'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import type { Listing, User, Flat } from '@/lib/types'

interface ProfileTabsProps {
    activeListings: Listing[]
    soldListings: Listing[]
    flats: Flat[]
    profile: User
    currentUserId: string
}

export function ProfileTabs({ activeListings, soldListings, flats, profile, currentUserId }: ProfileTabsProps) {
    // Controlled state for Tabs to enable Framer Motion animations
    const [activeTab, setActiveTab] = useState("anuncios")

    // Sub-filter for Anuncios
    type FilterType = 'all' | 'products' | 'flats' | 'sold'
    const [filter, setFilter] = useState<FilterType>('all')

    const hasActiveListings = activeListings.length > 0
    const hasSoldListings = soldListings.length > 0
    const hasFlats = flats.length > 0

    // Filter logic
    const showProducts = (filter === 'all' || filter === 'products') && hasActiveListings
    const showFlats = (filter === 'all' || filter === 'flats') && hasFlats
    const showSold = (filter === 'sold') && hasSoldListings

    // Calculate counts
    const totalActive = activeListings.length + flats.length

    const tabs = [
        { id: 'anuncios', label: 'Anuncios' },
        { id: 'valoraciones', label: 'Valoraciones' },
    ]

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="w-full border-b border-border/50">
                <div className="container max-w-5xl mx-auto px-4">
                    <TabsList className="flex w-full h-12 bg-transparent p-0 rounded-none shadow-none space-x-0 justify-start gap-8">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="group relative rounded-none border-none data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 hover:bg-muted/20 transition-colors h-full"
                            >
                                <span className={cn(
                                    "relative z-10 text-sm font-semibold tracking-wide transition-colors duration-200",
                                    activeTab === tab.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground/80"
                                )}>
                                    {tab.label}
                                </span>
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="active-tab-indicator-profile"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
            </div>

            <div className="container max-w-5xl mx-auto px-4 py-8 min-h-[50vh]">
                <TabsContent value="anuncios" className="mt-0 outline-none space-y-6">

                    {/* Filters / Counters */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-xl font-semibold">
                            {filter === 'sold' ? `${soldListings.length} vendidos` : `${totalActive} artículos`}
                        </h2>

                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('all')}
                                className="rounded-full h-8"
                            >
                                Todos
                            </Button>
                            <Button
                                variant={filter === 'products' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('products')}
                                className="rounded-full h-8 whitespace-nowrap"
                                disabled={!hasActiveListings && filter !== 'products'}
                            >
                                Productos ({activeListings.length})
                            </Button>
                            <Button
                                variant={filter === 'flats' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('flats')}
                                className="rounded-full h-8 whitespace-nowrap"
                                disabled={!hasFlats && filter !== 'flats'}
                            >
                                Pisos ({flats.length})
                            </Button>
                            <Button
                                variant={filter === 'sold' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('sold')}
                                className="rounded-full h-8"
                                disabled={!hasSoldListings && filter !== 'sold'}
                            >
                                Vendidos
                            </Button>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="space-y-8">
                        {showProducts && (
                            <div className="space-y-4">
                                {filter === 'all' && hasFlats && <h3 className="font-semibold text-lg">Productos</h3>}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {activeListings.map((listing) => (
                                        <ListingCard
                                            key={listing.id}
                                            listing={{ ...listing, user: profile as any }}
                                            currentUserId={currentUserId}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {showFlats && (
                            <div className="space-y-4">
                                {(filter === 'all' || filter === 'flats') && hasActiveListings && filter !== 'flats' && <h3 className="font-semibold text-lg">Inmuebles</h3>}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                    {flats.map((flat) => (
                                        <FlatCard
                                            key={flat.id}
                                            flat={{ ...flat, user: profile as any }}
                                            currentUserId={currentUserId}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {showSold && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 opacity-75">
                                {soldListings.map((listing) => (
                                    <ListingCard
                                        key={listing.id}
                                        listing={{ ...listing, user: profile as any }}
                                        currentUserId={currentUserId}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Empty States */}
                        {!showProducts && !showFlats && !showSold && (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Package className="h-12 w-12 mb-4 opacity-20" />
                                <p>No hay artículos para mostrar con este filtro</p>
                            </div>
                        )}
                    </div>

                </TabsContent>

                <TabsContent value="valoraciones" className="mt-0 outline-none">
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                        <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-foreground">Aún no hay valoraciones</h3>
                        <p className="max-w-md text-center mt-2">Las valoraciones de otros usuarios aparecerán aquí. ¡Sé el primero en valorar!</p>
                    </div>
                </TabsContent>
            </div>
        </Tabs>
    )
}
