'use client'

import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { MapPin } from 'lucide-react'

// ✅ DYNAMIC IMPORT - Leaflet only loads when map is needed (~200KB saved)
const ListingMapComponent = dynamic(
    () => import('./listing-map-component'),
    {
        ssr: false,
        loading: () => (
            <div className="h-48 w-full rounded-2xl bg-muted animate-pulse flex items-center justify-center">
                <MapPin className="h-8 w-8 text-muted-foreground/30 animate-bounce" />
            </div>
        )
    }
)

interface ListingMapProps {
    location: string
    className?: string
}

export default function ListingMap({ location, className }: ListingMapProps) {
    return <ListingMapComponent location={location} className={className} />
}
