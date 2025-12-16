
'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface SimpleAlertDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    onConfirm: () => Promise<void> | void
    isDestructive?: boolean
    isLoading?: boolean
    confirmText?: string
    cancelText?: string
}

export function SimpleAlertDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    isDestructive = false,
    isLoading = false,
    confirmText = "Confirmar",
    cancelText = "Cancelar"
}: SimpleAlertDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-row gap-2 justify-end sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={isDestructive ? "destructive" : "default"}
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
