
import { Suspense } from 'react'
import { PublicProfileContent } from '@/components/profile/public-profile-content'

interface PageProps {
    params: Promise<{
        username: string
    }>
}

export default async function PublicProfilePage(props: PageProps) {
    const params = await props.params;
    const { username } = params;

    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <PublicProfileContent alias={username} />
        </Suspense>
    )
}
