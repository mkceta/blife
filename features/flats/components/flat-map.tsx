'use client'

import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'
import { FlatMapComponentProps } from './flat-map-component'

// ✅ DYNAMIC IMPORT - FlatMap only loads when viewing flats page
const FlatMapComponent = dynamic(
    () => import('./flat-map-component'),
    {
        ssr: false,
        loading: () => (
            <div className="h-full w-full bg-muted/20 animate-pulse rounded-xl flex items-center justify-center">
                <MapPin className="h-12 w-12 text-muted-foreground/20 animate-bounce" />
            </div>
        )
    }
)

export default function FlatMap(props: FlatMapComponentProps) {
    return <FlatMapComponent {...props} />
}
