'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EditFlatForm } from './edit-flat-form' // Ensure this component is client-side compatible

function EditFlatContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const [flat, setFlat] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            if (!id) {
                router.push('/flats')
                return
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            const { data: flatData, error } = await supabase
                .from('flats')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !flatData) {
                // Handle not found
                router.push('/flats')
                return
            }

            if (flatData.user_id !== user.id) {
                router.push(`/flats/view?id=${flatData.id}`)
                return
            }

            setFlat(flatData)
            setLoading(false)
        }

        fetchData()
    }, [id, router, supabase])

    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
    if (!flat) return null

    return (
        <div className="min-h-screen bg-background">
            <EditFlatForm flat={flat} />
        </div>
    )
}

export default function EditFlatPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <EditFlatContent />
        </Suspense>
    )
}
