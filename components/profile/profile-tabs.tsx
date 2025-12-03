'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Package, Star, Home } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

    const defaultTab = hasActiveListings ? 'active' : (hasSoldListings ? 'sold' : 'flats')
    const [activeTab, setActiveTab] = useState(defaultTab)

    const tabCount = [hasActiveListings, hasSoldListings, hasFlats].filter(Boolean).length

    return (
        <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={setActiveTab} className="p-4">
            <TabsList className={cn(
                "grid w-full relative glass-strong rounded-xl p-1",
                tabCount === 3 ? 'grid-cols-3' : tabCount === 2 ? 'grid-cols-2' : 'grid-cols-1'
            )}>
                {hasActiveListings && (
                    <TabsTrigger
                        value="active"
                        className="relative z-10 data-[state=active]:bg-transparent transition-colors duration-200"
                    >
                        {activeTab === 'active' && (
                            <motion.div
                                layoutId="profile-tab-indicator"
                                className="absolute inset-0 bg-background shadow-sm rounded-md"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Activos
                        </span>
                    </TabsTrigger>
                )}
                {hasSoldListings && (
                    <TabsTrigger
                        value="sold"
                        className="relative z-10 data-[state=active]:bg-transparent transition-colors duration-200"
                    >
                        {activeTab === 'sold' && (
                            <motion.div
                                layoutId="profile-tab-indicator"
                                className="absolute inset-0 bg-background shadow-sm rounded-md"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Vendidos
                        </span>
                    </TabsTrigger>
                )}
                {hasFlats && (
                    <TabsTrigger
                        value="flats"
                        className="relative z-10 data-[state=active]:bg-transparent transition-colors duration-200"
                    >
                        {activeTab === 'flats' && (
                            <motion.div
                                layoutId="profile-tab-indicator"
                                className="absolute inset-0 bg-background shadow-sm rounded-md"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            Pisos
                        </span>
                    </TabsTrigger>
                )}
            </TabsList>

            <AnimatePresence mode="wait">
                {activeTab === 'active' && hasActiveListings && (
                    <TabsContent value="active" className="mt-4 outline-none" asChild>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {activeListings.map((listing) => (
                                    <ListingCard
                                        key={listing.id}
                                        listing={{ ...listing, user: profile }}
                                        currentUserId={currentUserId}
                                        isFavorited={false} // We don't have this info here easily, but it's own profile so maybe not needed
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </TabsContent>
                )}

                {activeTab === 'sold' && hasSoldListings && (
                    <TabsContent value="sold" className="mt-4 outline-none" asChild>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {soldListings.map((listing) => (
                                    <ListingCard
                                        key={listing.id}
                                        listing={{ ...listing, user: profile }}
                                        currentUserId={currentUserId}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </TabsContent>
                )}

                {activeTab === 'flats' && hasFlats && (
                    <TabsContent value="flats" className="mt-4 outline-none" asChild>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {flats.map((flat) => (
                                    <FlatCard
                                        key={flat.id}
                                        flat={{ ...flat, user: profile }}
                                        currentUserId={currentUserId}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </TabsContent>
                )}
            </AnimatePresence>
        </Tabs>
    )
}
