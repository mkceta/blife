'use client'

import { useState, useEffect } from 'react'
import { Wallet, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function SellerDashboardButton({ userId, initialStripeConnected = false }: { userId: string, initialStripeConnected?: boolean }) {
    const [status, setStatus] = useState<'none' | 'pending' | 'active'>(initialStripeConnected ? 'active' : 'none')
    const supabase = createClient()

    useEffect(() => {
        checkStatus()
    }, [])

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
        <div className="flex items-center gap-4 p-4 rounded-lg">
            <Wallet className="h-6 w-6" strokeWidth={1.5} />
            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                    <span className="font-medium">Pagos y Cobros</span>
                    <div className="flex items-center gap-2">
                        {status === 'active' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {status === 'pending' && <span className="text-yellow-600 text-xs">Pendiente</span>}
                        {status === 'none' && <XCircle className="h-5 w-5 text-red-500" />}
                    </div>
                </div>

                {status === 'active' ? (
                    <span className="text-[10px] text-muted-foreground mt-1">
                        Ya puedes realizar compras y vender en el mercado
                    </span>
                ) : (
                    <span className="text-[10px] text-muted-foreground mt-1 leading-tight">
                        Se te pedirá configurarlo cuando realices tu primera transacción en el mercado
                    </span>
                )}
            </div>
        </div>
    )
}

