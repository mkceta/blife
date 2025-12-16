'use client'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Check, Clock, Tag, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface FlatStatusControlsProps {
    flatId: string
    flatTitle: string
    currentStatus: 'active' | 'reserved' | 'sold'
}

export function FlatStatusControls({ flatId, flatTitle, currentStatus }: FlatStatusControlsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    async function handleStatusChange(status: 'active' | 'reserved' | 'sold') {
        if (status === currentStatus) return

        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('flats')
                .update({ status })
                .eq('id', flatId)

            if (error) throw error

            toast.success('Estado actualizado')
            router.refresh()
        } catch (error) {
            console.error('Error updating flat status:', error)
            toast.error('Error al actualizar estado')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDelete() {
        try {
            const { error } = await supabase
                .from('flats')
                .delete()
                .eq('id', flatId)

            if (error) throw error

            toast.success('Piso eliminado')
            router.push('/flats')
            router.refresh()
        } catch (error) {
            console.error('Error deleting flat:', error)
            toast.error('Error al eliminar el piso')
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 bg-black/50 hover:bg-black/70 border-none text-white" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MoreVertical className="h-5 w-5" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                        <Tag className="mr-2 h-4 w-4" />
                        Disponible
                        {currentStatus === 'active' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('reserved')}>
                        <Clock className="mr-2 h-4 w-4" />
                        Reservado
                        {currentStatus === 'reserved' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('sold')}>
                        <Check className="mr-2 h-4 w-4" />
                        Alquilado
                        {currentStatus === 'sold' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar piso
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title={flatTitle}
                itemType="piso"
                onConfirm={handleDelete}
            />
        </>
    )
}
