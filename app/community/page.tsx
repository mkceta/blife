import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { markNotificationsAsReadByType } from '../notifications/mark-read-helpers';
import { CommunityFeed } from '@/components/community/community-feed';
import { CommunitySearchBar } from '@/components/community/community-search-bar';
import { getCachedPosts } from '@/lib/community-data';
import { createClient } from '@/lib/supabase-server';

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
    // Mark unread comment notifications as read for this user
    await markNotificationsAsReadByType('comment');

    const params = await searchParams
    const currentCategory = params.category || 'General'
    const searchQuery = params.q || ''

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch Posts using Cache strategy
    // We intentionally fetch a larger set (default 20->100 in cached fn?) or reliance on client filtering
    // Actually, getCachedPosts handles optional filtering. 
    // To support "Instant" search we want to fetch mostly everything for the category and let client filter.
    // If a search query exists in URL initially, we server-filter for SEO/Speed on first load.
    const initialPosts = await getCachedPosts(currentCategory, searchQuery) // Pass params for initial load correctness

    // Fetch User Reactions - Keep this fresh or we could cache it too if we want but reactions are personalized
    let initialReactions: string[] = []
    if (user && initialPosts && initialPosts.length > 0) {
        // We can optimize this by parallelizing with getCachedPosts if we moved user fetch up
        const postIds = initialPosts.map((p: any) => p.id)
        const { data: reactions } = await supabase
            .from('reactions')
            .select('target_id')
            .eq('user_id', user.id)
            .eq('target_type', 'post')
            .in('target_id', postIds)

        if (reactions) {
            initialReactions = reactions.map((r: any) => r.target_id)
        }
    }

    return (
        <div className="min-h-screen bg-background pb-20">
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
                <CommunityFeed
                    category={currentCategory}
                    searchQuery={searchQuery}
                    initialPosts={initialPosts || []}
                    initialReactions={initialReactions}
                    currentUserId={user?.id}
                />
            </div>

            <Link
                href="/community/new"
            >
                <Button
                    className="fixed bottom-[8rem] right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 z-[60] hover:shadow-primary/25 md:bottom-10"
                    size="icon"
                >
                    <Plus className="h-7 w-7" strokeWidth={3} />
                </Button>
            </Link>
        </div>
    );
}
