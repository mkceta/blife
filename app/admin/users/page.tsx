'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { UserTable } from '@/components/admin/user-table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Users } from 'lucide-react'
import Link from 'next/link'

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

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

            const { data: usersData } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100) // Limit for MVP

            setUsers(usersData || [])
            setLoading(false)
        }

        fetchData()
    }, [router, supabase])

    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando usuarios...</div>

    return (
        <div className="p-6 pb-20 md:pb-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="hover:bg-white/10">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-primary shadow-glow-primary">
                        <Users className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
                </div>
            </div>

            <UserTable users={users} />
        </div>
    )
}
