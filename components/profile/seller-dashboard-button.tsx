'use client'

import { useState, useEffect } from 'react'
import { Wallet, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export function SellerDashboardButton({ userId }: { userId: string }) {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'none' | 'pending' | 'active'>('none')
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

    const handleConnect = async () => {
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                toast.error('Debes iniciar sesión')
                return
            }

            const { data, error } = await supabase.functions.invoke('stripe-connect', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            })

            if (error) throw error

            // Check for functional error returned as 200 OK
            if (data?.error) {
                throw new Error(data.error)
            }

            if (data?.url) {
                window.location.href = data.url
            }
        } catch (error: any) {
            console.error('Stripe connect error:', error)
            toast.error(`Error: ${error.message || 'No se pudo conectar con Stripe'}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            onClick={handleConnect}
            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-lg cursor-pointer"
        >
            <Wallet className="h-6 w-6" strokeWidth={1.5} />
            <div className="flex-1 flex flex-col">
                <span className="font-medium">Pagos y Cobros</span>
                {status === 'active' && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Cuenta activa para vender</span>}
                {status === 'pending' && <span className="text-xs text-yellow-600 font-medium">Configuración incompleta</span>}
                {status === 'none' && <span className="text-xs text-muted-foreground">Configura tu cuenta para vender</span>}
            </div>
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        </div>
    )
}
