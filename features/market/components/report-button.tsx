'use client'

import { Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface ReportButtonProps {
    targetType: 'listing' | 'post' | 'user' | 'flat'
    targetId: string
    variant?: 'outline' | 'default' | 'secondary'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    className?: string
}

const REPORT_REASONS = [
    { value: 'spam', label: 'Spam o publicidad' },
    { value: 'inapropiado', label: 'Contenido inapropiado' },
    { value: 'duplicado', label: 'Duplicado' },
    { value: 'estafa', label: 'Posible estafa' },
    { value: 'otro', label: 'Otro' },
]

export function ReportButton({ targetType, targetId, variant = 'secondary', size = 'icon', className }: ReportButtonProps) {
    const [open, setOpen] = useState(false)
    const [reason, setReason] = useState('')
    const [details, setDetails] = useState('')
    const [isPending, startTransition] = useTransition()
    const supabase = createClient()

    const handleSubmit = () => {
        if (!reason) {
            toast.error('Selecciona un motivo')
            return
        }

        startTransition(async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    toast.error('Debes iniciar sesión')
                    return
                }

                const { error } = await supabase
                    .from('reports')
                    .insert({
                        reporter_id: user.id,
                        target_type: targetType,
                        target_id: targetId,
                        reason: reason,
                        details: details || null
                    })

                if (error) throw error

                toast.success('Reporte enviado. Gracias por tu colaboración.')
                setOpen(false)
                setReason('')
                setDetails('')
            } catch (error: unknown) {
                console.error('Error creating report:', error)
                toast.error('Error al enviar reporte')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className={className}
                >
                    <Flag className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reportar contenido</DialogTitle>
                    <DialogDescription>
                        Ayúdanos a mantener la comunidad segura reportando contenido inapropiado.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-3">
                        <Label>Motivo del reporte</Label>
                        <RadioGroup value={reason} onValueChange={setReason}>
                            {REPORT_REASONS.map((r) => (
                                <div key={r.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={r.value} id={r.value} />
                                    <Label htmlFor={r.value} className="font-normal cursor-pointer">
                                        {r.label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="details">Detalles adicionales (opcional)</Label>
                        <Textarea
                            id="details"
                            placeholder="Proporciona más información sobre el problema..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isPending || !reason}>
                            {isPending ? 'Enviando...' : 'Enviar reporte'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

