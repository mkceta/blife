'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export interface CheckoutModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    listingId: string
    priceCents: number
}

export default function CheckoutModalComponent({
    open,
    onOpenChange,
    listingId,
    priceCents
}: CheckoutModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handlePayment = async () => {
        setIsLoading(true)
        try {
            // Placeholder for Stripe implementation
            toast.info("Funcionalidad de pago en construcción")
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1000))
            onOpenChange(false)
        } catch (error) {
            toast.error("Error en el pago")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Finalizar Compra</DialogTitle>
                    <DialogDescription>
                        Estás a un paso de reservar este artículo.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="flex justify-between items-center mb-4 p-4 bg-muted/50 rounded-lg">
                        <span className="font-medium">Total a pagar:</span>
                        <span className="text-xl font-bold">{(priceCents / 100).toFixed(2)}€</span>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handlePayment} disabled={isLoading}>
                        {isLoading ? "Procesando..." : "Pagar ahora"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
