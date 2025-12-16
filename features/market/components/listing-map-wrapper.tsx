'use client'

import dynamic from 'next/dynamic'

const ListingMap = dynamic(() => import('./listing-map'), {
    ssr: false,
    loading: () => <div className="h-48 w-full rounded-2xl bg-muted animate-pulse" />
})

interface ListingMapWrapperProps {
    location: string
    className?: string
}

export function ListingMapWrapper(props: ListingMapWrapperProps) {
    return <ListingMap {...props} />
}
