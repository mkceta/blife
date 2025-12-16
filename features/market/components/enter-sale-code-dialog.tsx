'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { verifySaleCode } from '@/app/market/sale-actions'
import { Keyboard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function EnterSaleCodeDialog() {
    const [code, setCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return

        setIsLoading(true)
        const result = await verifySaleCode(code)
        setIsLoading(false)

        if (result.error) {
            toast.error('Código inválido')
        } else if (result.token) {
            setIsOpen(false)
            router.push(`/market/verify-sale?token=${result.token}`)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                    <Keyboard className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Ingresar Código de Venta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 p-4">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Introduce el código de 6 caracteres que te ha dado el vendedor.
                        </p>
                        <Input
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Ej: A1B2C3"
                            className="text-center text-2xl tracking-widest uppercase font-mono"
                            maxLength={6}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || code.length < 6}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verificar Código
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
