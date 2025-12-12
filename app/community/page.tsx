import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { markNotificationsAsReadByType } from '../notifications/mark-read-helpers';
import { CommunityFeed } from '@/components/community/community-feed';
import { CommunitySkeleton } from '@/components/community/community-skeleton';
import { Input } from '@/components/ui/input';

const CATEGORIES = [
    { id: 'General', label: '🔥 General' },
    { id: 'Peticiones', label: '🙏 Peticiones' },
    { id: 'Fiesta', label: '🍻 Fiesta' },
    { id: 'Deporte', label: '⚽ Deporte' },
    { id: 'Eventos', label: '🎉 Eventos' },
    { id: 'Entradas', label: '🎟️ Entradas' },
    { id: 'Offtopic', label: '🤡 Offtopic' },
]

function CommunitySearchBar({ defaultValue }: { defaultValue: string }) {
    return (
        <form action="/community" method="GET" className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                name="q"
                defaultValue={defaultValue}
                placeholder="Buscar en la comunidad..."
                className="pl-9 h-9 bg-muted/50 border-border/50 focus-visible:ring-1 rounded-full text-sm"
            />
        </form>
    )
}

import { createClient } from '@/lib/supabase-server'

// ... existing imports ...

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ category?: string, q?: string }> }) {
    // Mark unread comment notifications as read for this user
    await markNotificationsAsReadByType('comment');

    const params = await searchParams
    const currentCategory = params.category || 'General'
    const searchQuery = params.q || ''

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch Posts
    let query = supabase
        .from('posts')
        .select(`
                *,
                user:users!posts_user_id_fkey(id, alias_inst, avatar_url)
            `)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(20)

    if (currentCategory && currentCategory !== 'Todos') {
        query = query.contains('category', [currentCategory])
    }

    if (searchQuery) {
        query = query.ilike('text', `%${searchQuery}%`)
    }

    const { data: posts } = await query

    // Fetch User Reactions
    let initialReactions: string[] = []
    if (user && posts && posts.length > 0) {
        const postIds = posts.map(p => p.id)
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
                    <CommunityFeed
                        category={currentCategory}
                        searchQuery={searchQuery}
                        initialPosts={posts || []}
                        initialReactions={initialReactions}
                        currentUserId={user?.id}
                    />
                </Suspense>
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
