'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QRCodeSVG } from 'qrcode.react'
import { generateSaleToken } from '@/app/market/sale-actions'
import { QrCode, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SaleQRDialogProps {
    listingId: string
    listingTitle: string
}

export function SaleQRDialog({ listingId, listingTitle }: SaleQRDialogProps) {
    const [token, setToken] = useState<string | null>(null)
    const [code, setCode] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const handleGenerate = async () => {
        setIsLoading(true)
        const result = await generateSaleToken(listingId)
        setIsLoading(false)

        if (result.error) {
            toast.error('Error al generar el código')
        } else {
            setToken(result.token!)
            setCode(result.code!)
        }
    }

    // Use production URL for QR code so it can be scanned by mobile devices
    const baseUrl = 'https://blife-udc.vercel.app'
    const verificationUrl = `${baseUrl}/market/verify-sale?token=${token}`

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                    <QrCode className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Vender "{listingTitle}"</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    {!token ? (
                        <div className="text-center space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Genera un código QR para que el comprador lo escanee y confirme la compra.
                            </p>
                            <Button onClick={handleGenerate} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generar Código de Venta
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="bg-white p-4 rounded-xl shadow-sm border">
                                <QRCodeSVG value={verificationUrl} size={200} />
                            </div>

                            <div className="text-center space-y-1">
                                <p className="text-sm text-muted-foreground">Código manual:</p>
                                <p className="text-3xl font-mono font-bold tracking-wider">{code}</p>
                            </div>

                            <p className="text-sm text-center text-muted-foreground max-w-[250px]">
                                Pide al comprador que escanee el QR o ingrese el código manual.
                            </p>
                            <Button variant="ghost" size="sm" onClick={() => setToken(null)}>
                                Generar nuevo código
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
