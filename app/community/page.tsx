

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { markNotificationsAsReadByType } from '../notifications/mark-read-helpers';
import { CommunityFeed } from '@/components/community/community-feed';
import { CommunitySkeleton } from '@/components/community/community-skeleton';

export default async function CommunityPage() {
    // Mark unread comment notifications as read for this user
    // We can do this without blocking the UI, but it's an async server action essentially
    await markNotificationsAsReadByType('comment');

    return (
        <div className="bg-gradient-to-b from-primary/10 via-primary/5 to-background min-h-screen pb-20">
            <div className="max-w-2xl mx-auto p-4 space-y-4">
                <PageHeader title="Comunidad UDC" icon={<MessageCircle className="h-5 w-5 text-primary" />} />

                <Suspense fallback={<CommunitySkeleton />}>
                    <CommunityFeed />
                </Suspense>

                <Link href="/community/new">
                    <Button className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-6 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 z-50 border-2 border-white/10" size="icon">
                        <Plus className="h-8 w-8" strokeWidth={3} />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
