import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { markNotificationsAsReadByType } from '../notifications/mark-read-helpers';
import { CommunitySkeleton } from '@/components/community/community-skeleton';
import { CommunitySearchBar } from '@/components/community/community-search-bar';
import { CommunityFeedContent } from './community-feed-content';
import { CommunityReadMarker } from '@/components/community/community-read-marker';
import { CreateContentButton } from '@/components/community/create-content-button';

const CATEGORIES = [
    { id: 'General', label: '🔥 General' },
    { id: 'Peticiones', label: '🙏 Peticiones' },
    { id: 'Fiesta', label: '🍻 Fiesta' },
    { id: 'Deporte', label: '⚽ Deporte' },
    { id: 'Eventos', label: '🎉 Eventos' },
    { id: 'Entradas', label: '🎟️ Entradas' },
    { id: 'Offtopic', label: '🤡 Offtopic' },
]

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ category?: string, q?: string }> }) {
    const params = await searchParams
    const currentCategory = params.category || 'General'
    const searchQuery = params.q || ''

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Non-blocking background action */}
            <CommunityReadMarker />

            {/* Standard App Header Style */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md shadow-sm">
                <div className="pt-[calc(env(safe-area-inset-top)+0.5rem)] px-4 pb-3 flex flex-col md:flex-row md:items-center gap-4 justify-between max-w-5xl mx-auto w-full">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <h1 className="text-xl font-bold">Comunidad UDC</h1>
                    </div>

                    <CommunitySearchBar defaultValue={searchQuery} />
                </div>

                {/* Categories / Threads */}
                <div className="max-w-5xl mx-auto w-full">
                    <div className="flex gap-2 overflow-x-auto pb-3 px-4 scrollbar-hide mask-fade-right md:justify-center md:flex-wrap">
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat.id}
                                href={cat.id === 'General' ? '/community' : `/community?category=${cat.id}`}
                                replace
                                scroll={false} // Prevent scroll jump on tab switch
                            >
                                <Button
                                    variant={currentCategory === cat.id ? "default" : "outline"}
                                    size="sm"
                                    className={`rounded-full whitespace-nowrap h-8 text-xs px-4 ${currentCategory === cat.id ? 'shadow-md shadow-primary/20' : 'bg-background hover:bg-muted border-border/50'}`}
                                >
                                    {cat.label}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-4">
                <Suspense fallback={<CommunitySkeleton />}>
                    <CommunityFeedContent searchParams={searchParams} />
                </Suspense>
            </div>

            {/* Unified create button */}
            <CreateContentButton />
        </div>
    );
}
