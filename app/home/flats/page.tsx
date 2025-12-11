'use client'

import { Suspense } from 'react'
import { FlatsSkeleton } from '@/components/home/flats-skeleton'
import { FlatsFeed, FlatsSearchBar } from '@/components/home/flats-feed'
import { FadeIn } from '@/components/ui/fade-in'

export default function FlatsPage() {
    return (
        <div className="min-h-[50vh] outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Suspense fallback={<FlatsSkeleton />}>
                <FlatsSearchBar flats={[]} />
                <FadeIn>
                    <FlatsFeed />
                </FadeIn>
            </Suspense>
        </div>
    )
}
