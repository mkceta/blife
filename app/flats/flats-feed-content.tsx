'use client'

import { FlatsFeed } from '@/components/home/flats-feed'
import { FlatsSearchBar } from '@/components/home/flats-search-bar'

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
