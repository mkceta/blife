'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Package, Star, Home, Grid3X3 } from 'lucide-react'
import { ListingCard } from '@/components/market/listing-card'
import { FlatCard } from '@/components/flats/flat-card'
import { cn } from '@/lib/utils'

interface ProfileTabsProps {
    activeListings: any[]
    soldListings: any[]
    flats: any[]
    profile: any
    currentUserId: string
}

export function ProfileTabs({ activeListings, soldListings, flats, profile, currentUserId }: ProfileTabsProps) {
    const hasActiveListings = activeListings.length > 0
    const hasSoldListings = soldListings.length > 0
    const hasFlats = flats.length > 0
    const hasAnyContent = hasActiveListings || hasSoldListings || hasFlats

    const defaultTab = hasActiveListings ? 'active' : (hasSoldListings ? 'sold' : 'flats')

    // If no content, show empty state in 'active' tab
    const [activeTab, setActiveTab] = useState(hasAnyContent ? defaultTab : 'active')

    return (
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="sticky top-16 md:top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b w-full">
                <TabsList className="w-full justify-start h-12 bg-transparent p-0 rounded-none container max-w-5xl mx-auto px-4">
                    <TabsTrigger
                        value="active"
                        className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none transition-none"
                    >
                        <span className="flex items-center gap-2">
                            <Grid3X3 className="h-4 w-4" />
                            Armario
                            <span className="text-xs text-muted-foreground ml-1">({activeListings.length})</span>
                        </span>
                    </TabsTrigger>

                    <TabsTrigger
                        value="sold"
                        className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none transition-none"
                    >
                        <span className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Vendidos
                            <span className="text-xs text-muted-foreground ml-1">({soldListings.length})</span>
                        </span>
                    </TabsTrigger>

                    {hasFlats && (
                        <TabsTrigger
                            value="flats"
                            className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none transition-none"
                        >
                            <span className="flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                Pisos
                                <span className="text-xs text-muted-foreground ml-1">({flats.length})</span>
                            </span>
                        </TabsTrigger>
                    )}
                </TabsList>
            </div>

            <div className="container max-w-5xl mx-auto px-2 py-4 min-h-[50vh]">
                <TabsContent value="active" className="mt-0 outline-none">
                    {activeListings.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {activeListings.map((listing) => (
                                <ListingCard
                                    key={listing.id}
                                    listing={{ ...listing, user: profile }}
                                    currentUserId={currentUserId}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Package className="h-12 w-12 mb-4 opacity-20" />
                            <p>El armario está vacío</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="sold" className="mt-0 outline-none">
                    {soldListings.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {soldListings.map((listing) => (
                                <ListingCard
                                    key={listing.id}
                                    listing={{ ...listing, user: profile }}
                                    currentUserId={currentUserId}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <p>No hay artículos vendidos</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="flats" className="mt-0 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {flats.map((flat) => (
                            <FlatCard
                                key={flat.id}
                                flat={{ ...flat, user: profile }}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </div>
                </TabsContent>
            </div>
        </Tabs>
    )
}
