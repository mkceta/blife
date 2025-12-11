

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { markNotificationsAsReadByType } from '../notifications/mark-read-helpers';
import { CommunityFeed } from '@/components/community/community-feed';
import { CommunitySkeleton } from '@/components/community/community-skeleton';

const CATEGORIES = [
    { id: 'General', label: '🔥 General' },
    { id: 'Dudas', label: '❓ Dudas' },
    { id: 'Eventos', label: '🎉 Eventos' },
    { id: 'Deportes', label: '⚽ Deportes' },
    { id: 'Fiestas', label: '🍻 Fiestas' },
    { id: 'Amor', label: '❤️ Amor' },
    { id: 'Memes', label: '🤡 Memes' },
]

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
    // Mark unread comment notifications as read for this user
    await markNotificationsAsReadByType('comment');

    const params = await searchParams
    const currentCategory = params.category || 'General'

    return (
        <div className="bg-gradient-to-b from-primary/10 via-primary/5 to-background min-h-screen pb-20">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40 pb-2">
                <div className="max-w-2xl mx-auto p-4 pb-0 space-y-4">
                    <PageHeader title="Comunidad UDC" icon={<MessageCircle className="h-5 w-5 text-primary" />} />

                    {/* Categories / Threads */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 mask-fade-right">
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat.id}
                                href={cat.id === 'General' ? '/community' : `/community?category=${cat.id}`}
                                replace
                            >
                                <Button
                                    variant={currentCategory === cat.id ? "default" : "outline"}
                                    size="sm"
                                    className={`rounded-full whitespace-nowrap ${currentCategory === cat.id ? 'shadow-md shadow-primary/20' : 'bg-background hover:bg-muted'}`}
                                >
                                    {cat.label}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-4 pt-2">
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
