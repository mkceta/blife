'use client'

import { useState, useEffect } from 'react'
import { Wallet, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

import { StripeConnectModal } from '@/components/payment/stripe-connect-modal'

export function SellerDashboardButton({ userId }: { userId: string }) {
    const [status, setStatus] = useState<'none' | 'pending' | 'active'>('none')
    const [openModal, setOpenModal] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        checkStatus()
    }, [openModal]) // Re-check status when modal closes

    const checkStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('stripe_accounts')
                .select('details_submitted, charges_enabled')
                .eq('user_id', userId)
                .single()

            if (data) {
                if (data.charges_enabled) setStatus('active')
                else setStatus('pending')
            }
        } catch (error) {
            console.error('Error checking stripe status:', error)
        }
    }


    return (
        <>
            <div
                onClick={() => setOpenModal(true)}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-lg cursor-pointer"
            >
                <Wallet className="h-6 w-6" strokeWidth={1.5} />
                <div className="flex-1 flex flex-col">
                    <span className="font-medium">Pagos y Cobros</span>
                    {status === 'active' && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Cuenta activa para vender</span>}
                    {status === 'pending' && <span className="text-xs text-yellow-600 font-medium">Configuración incompleta</span>}
                    {status === 'none' && <span className="text-xs text-muted-foreground">Configura tu cuenta para vender</span>}
                </div>
            </div>

            <StripeConnectModal open={openModal} onOpenChange={setOpenModal} />
        </>
    )
}

