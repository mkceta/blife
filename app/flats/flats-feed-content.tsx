'use client'

import { FlatsFeed } from '@/features/home/components/flats-feed'
import { FlatsSearchBar } from '@/features/home/components/flats-search-bar'

export function FlatsFeedContent({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    // Just pass through - FlatsFeed will handle everything with React Query
    return (
        <>
            <FlatsSearchBar flats={[]} />
            <FlatsFeed initialFlats={[]} currentUserId={undefined} />
        </>
    )
}
