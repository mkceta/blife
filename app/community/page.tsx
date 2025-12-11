

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { markNotificationsAsReadByType } from '../notifications/mark-read-helpers';
import { CommunityFeed } from '@/components/community/community-feed';
import { CommunitySkeleton } from '@/components/community/community-skeleton';

const CATEGORIES = [
    { id: 'General', label: '🔥 General' },
    { id: 'Peticiones', label: '🙏 Peticiones' },
    { id: 'Fiesta', label: '🍻 Fiesta' },
    { id: 'Deporte', label: '⚽ Deporte' },
    { id: 'Eventos', label: '🎉 Eventos' },
    { id: 'Entradas', label: '🎟️ Entradas' },
    { id: 'Offtopic', label: '🤡 Offtopic' },
]

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
    // Mark unread comment notifications as read for this user
    await markNotificationsAsReadByType('comment');

    const params = await searchParams
    const currentCategory = params.category || 'General'

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Standard App Header Style */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
                <div className="pt-[calc(env(safe-area-inset-top)+0.5rem)] px-4 pb-3 flex items-center justify-between">
                    <h1 className="text-xl font-bold">Comunidad UDC</h1>
                    {/* Optional: Add user avatar or search icon here if needed in future */}
                </div>

                {/* Categories / Threads */}
                <div className="max-w-screen-xl mx-auto">
                    <div className="flex gap-2 overflow-x-auto pb-3 px-4 scrollbar-hide mask-fade-right">
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat.id}
                                href={cat.id === 'General' ? '/community' : `/community?category=${cat.id}`}
                                replace
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

            <div className="max-w-2xl mx-auto p-4 space-y-4">
                <Suspense fallback={<CommunitySkeleton />}>
                    <CommunityFeed category={currentCategory} />
                </Suspense>

                <Link href="/community/new">
                    <Button className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 z-50 hover:shadow-primary/25" size="icon">
                        <Plus className="h-7 w-7" strokeWidth={3} />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
