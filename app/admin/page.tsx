'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { AdminStats } from '@/features/admin/components/admin-stats'
import { RecentActivity } from '@/features/admin/components/recent-activity'
import { Button } from '@/components/ui/button'
import { Users, FileText, Shield } from 'lucide-react'
import type { Photo } from '@/lib/types'

interface AdminStatsData {
    usersCount: number
    listingsCount: number
    soldCount: number
    reportsCount: number
    flatsCount: number
    postsCount: number
}

interface RecentUser {
    id: string
    alias_inst: string
    avatar_url?: string | null
    created_at: string
}

interface RecentListing {
    id: string
    title: string
    price_cents: number
    photos: Photo[]
    created_at: string
}

interface RecentFlat {
    id: string
    title: string
    rent_cents: number
    photos: Photo[]
    created_at: string
}

export default function AdminPage() {
    const [stats, setStats] = useState<AdminStatsData>({
        usersCount: 0,
        listingsCount: 0,
        soldCount: 0,
        reportsCount: 0,
        flatsCount: 0,
        postsCount: 0,
    })
    const [newUsers, setNewUsers] = useState<RecentUser[]>([])
    const [newListings, setNewListings] = useState<RecentListing[]>([])
    const [newFlats, setNewFlats] = useState<RecentFlat[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
            if (profile?.role !== 'admin') {
                router.push('/market')
                return
            }

            // Fetch Stats
            const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
            const { count: listingsCount } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active')
            const { count: soldCount } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'sold')
            const { count: reportsCount } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open')
            const { count: flatsCount } = await supabase.from('flats').select('*', { count: 'exact', head: true }).eq('status', 'active')
            const { count: postsCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('is_hidden', false)

            setStats({
                usersCount: usersCount || 0,
                listingsCount: listingsCount || 0,
                soldCount: soldCount || 0,
                reportsCount: reportsCount || 0,
                flatsCount: flatsCount || 0,
                postsCount: postsCount || 0,
            })

            // Fetch Recent Activity
            const { data: newUsersData } = await supabase
                .from('users')
                .select('id, alias_inst, avatar_url, created_at')
                .order('created_at', { ascending: false })
                .limit(5)

            const { data: newListingsData } = await supabase
                .from('listings')
                .select('id, title, price_cents, photos, created_at')
                .order('created_at', { ascending: false })
                .limit(5)

            const { data: newFlatsData } = await supabase
                .from('flats')
                .select('id, title, rent_cents, photos, created_at')
                .order('created_at', { ascending: false })
                .limit(5)

            setNewUsers(newUsersData || [])
            setNewListings(newListingsData || [])
            setNewFlats(newFlatsData || [])
            setLoading(false)
        }

        fetchData()
    }, [router, supabase])

    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando panel de administración...</div>

    return (
        <div className="p-6 space-y-8 pb-20 md:pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-primary shadow-glow-primary">
                        <Shield className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Panel de administración y moderación</p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Link href="/admin/users">
                        <Button variant="outline" className="glass-strong border-white/10 hover:border-primary/50">
                            <Users className="h-4 w-4 mr-2" />
                            Usuarios
                        </Button>
                    </Link>
                    <Link href="/admin/reports">
                        <Button variant="outline" className={stats.reportsCount > 0 ? "border-destructive text-destructive hover:bg-destructive/10" : "glass-strong border-white/10 hover:border-primary/50"}>
                            <FileText className="h-4 w-4 mr-2" />
                            Reportes
                            {stats.reportsCount > 0 && (
                                <span className="ml-2 bg-destructive text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {stats.reportsCount}
                                </span>
                            )}
                        </Button>
                    </Link>
                </div>
            </div>

            <AdminStats stats={stats} />

            <RecentActivity newUsers={newUsers} newListings={newListings} newFlats={newFlats} />
        </div>
    )
}
