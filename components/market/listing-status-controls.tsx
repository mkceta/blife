'use client'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Check, Clock, Tag, Trash2, Share2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface ListingStatusControlsProps {
    listingId: string
    listingTitle: string
    currentStatus: 'active' | 'reserved' | 'sold'
    currentUrl: string
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    className?: string
}

export function ListingStatusControls({
    listingId,
    listingTitle,
    currentStatus,
    currentUrl,
    variant = "secondary",
    className
}: ListingStatusControlsProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    async function handleStatusChange(status: 'active' | 'reserved' | 'sold') {
        if (status === currentStatus) return

        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('listings')
                .update({ status })
                .eq('id', listingId)

            if (error) throw error

            toast.success('Estado actualizado')
            router.refresh()
        } catch (error) {
            console.error('Error updating listing status:', error)
            toast.error('Error al actualizar estado')
        } finally {
            setIsLoading(false)
        }
    }

    const handleShare = async () => {
        const shareData = {
            title: `BLife - ${listingTitle}`,
            text: `Mira esto en BLife: ${listingTitle}`,
            url: currentUrl
        }

        try {
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(currentUrl)
                toast.success('Enlace copiado al portapapeles')
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error)
                toast.error('Error al compartir')
            }
        }
    }

    async function handleDelete() {
        try {
            const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', listingId)

            if (error) throw error

            toast.success('Anuncio eliminado')
            router.push('/market')
            router.refresh()
        } catch (error) {
            console.error('Error deleting listing:', error)
            toast.error('Error al eliminar el anuncio')
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant={variant}
                        size="icon"
                        className={className || "rounded-full h-10 w-10 bg-black/50 hover:bg-black/70 border-none text-white"}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MoreVertical className="h-5 w-5" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartir
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                        <Link href={`/market/edit?id=${listingId}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                    </DropdownMenuItem>

                    <div className="h-px bg-border my-1" />

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
                        Vendido
                        {currentStatus === 'sold' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>

                    <div className="h-px bg-border my-1" />

                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar anuncio
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title={listingTitle}
                itemType="anuncio"
                onConfirm={handleDelete}
            />
        </>
    )
}
