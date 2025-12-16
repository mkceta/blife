'use client'

import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'

// Re-export types for consumers
export type { FlatMapComponentProps } from './flat-map-component'

const FlatMap = dynamic(
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

export default FlatMap
