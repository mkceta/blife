'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface DeleteConfirmationDialogProps {
    trigger?: React.ReactNode
    title: string
    itemType: 'anuncio' | 'piso'
    onConfirm: () => Promise<void>
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function DeleteConfirmationDialog({
    trigger,
    title,
    itemType,
    onConfirm,
    open,
    onOpenChange
}: DeleteConfirmationDialogProps) {
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [internalOpen, setInternalOpen] = useState(false)

    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen
    const setIsOpen = isControlled ? onOpenChange! : setInternalOpen

    const handleConfirm = async () => {
        if (inputValue !== title) return

        setIsLoading(true)
        try {
            await onConfirm()
            toast.success(`${itemType === 'anuncio' ? 'Anuncio' : 'Piso'} eliminado correctamente`)
            setIsOpen(false)
        } catch (error) {
            toast.error("Error al eliminar")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(val) => {
            setIsOpen(val)
            if (!val) setInputValue("") // Reset input on close
        }}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Estás seguro?</DialogTitle>
                    <DialogDescription>
                        Esta acción no se puede deshacer. Para confirmar, escribe el título del {itemType} abajo.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-3 bg-muted rounded-md text-sm font-medium text-center select-all break-all">
                        {title}
                    </div>
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Escribe el título aquí..."
                        className="text-center"
                    />
                </div>
                <DialogFooter>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={inputValue !== title || isLoading}
                        className="w-full"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Eliminar {itemType}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
