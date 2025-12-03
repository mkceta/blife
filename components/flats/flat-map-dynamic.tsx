'use client'

import dynamic from 'next/dynamic'

const FlatMap = dynamic(() => import('./flat-map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted/20 animate-pulse rounded-xl" />
})

export default FlatMap
