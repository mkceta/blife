'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ReportActionsProps {
    reportId: string
    status: string
}

export function ReportActions({ reportId, status }: ReportActionsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleResolve = async () => {
        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('reports')
                .update({ status: 'resolved' })
                .eq('id', reportId)

            if (error) throw error

            toast.success('Reporte resuelto')
            router.refresh()
        } catch (error) {
            console.error('Error resolving report:', error)
            toast.error('Ocurrió un error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que quieres borrar este reporte?')) return

        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('reports')
                .delete()
                .eq('id', reportId)

            if (error) throw error

            toast.success('Reporte borrado')
            router.refresh()
        } catch (error) {
            console.error('Error deleting report:', error)
            toast.error('Ocurrió un error')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex justify-end gap-2">
            {status === 'open' && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResolve}
                    disabled={isLoading}
                    className="hover:bg-green-500/10 hover:text-green-500"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Resolver
                </Button>
            )}
            <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
                className="hover:bg-red-500/10 hover:text-red-500"
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Borrar
            </Button>
        </div>
    )
}
