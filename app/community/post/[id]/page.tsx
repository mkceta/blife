
'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/features/community/components/post-card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [post, setPost] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [hasUserReacted, setHasUserReacted] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function loadPost() {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)

            const { data: postData, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    user:users!posts_user_id_fkey(id, alias_inst, avatar_url)
                `)
                .eq('id', id)
                .single()

            if (error) {
                console.error(error)
                // router.push('/community') // Don't redirect immediately on error to debug
                setLoading(false)
                return
            }

            setPost(postData)

            if (user) {
                const { data: reaction } = await supabase
                    .from('reactions')
                    .select('id')
                    .eq('target_id', id)
                    .eq('target_type', 'post')
                    .eq('user_id', user.id)
                    .single()

                setHasUserReacted(!!reaction)
            }
            setLoading(false)
        }

        loadPost()
    }, [id, supabase, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
                <p className="text-muted-foreground">Publicación no encontrada</p>
                <Link href="/community">
                    <Button variant="outline">Volver a la comunidad</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-semibold">Publicación</h1>
            </div>

            <div className="max-w-2xl mx-auto p-4">
                <PostCard
                    post={post}
                    currentUser={currentUser}
                    hasUserReacted={hasUserReacted}
                    isDetail={true}
                />
            </div>
        </div>
    )
}
