'use client'

import { useState, useMemo } from 'react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ConnectComponentsProvider, ConnectAccountOnboarding } from "@stripe/react-connect-js"
import { loadConnectAndInitialize } from "@stripe/connect-js"
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { DialogTitle } from '@/components/ui/dialog'

interface StripeConnectComponentProps {
    accountId: string
    onComplete: () => void
}

export default function StripeConnectComponent({ accountId, onComplete }: StripeConnectComponentProps) {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)

    const connectInstance = useMemo(() => {
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        if (!key) {
            console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
            return null
        }

        return loadConnectAndInitialize({
            publishableKey: key,
            fetchClientSecret: async () => {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) throw new Error('No session')

                const { data, error } = await supabase.functions.invoke('stripe-connect', {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`
                    }
                })

                if (error) throw error
                if (data.error) throw new Error(data.error)

                setLoading(false)
                return data.clientSecret
            },
            appearance: {
                overlays: 'dialog',
                variables: {
                    colorPrimary: '#ff00a6', // Blife Pink
                    fontFamily: 'system-ui',
                    colorBackground: '#09090b', // Zinc 950
                    colorText: '#ffffff',
                },
            },
        })
    }, [])

    if (!connectInstance) {
        return (
            <div className="p-6">
                <h3 className="text-destructive font-bold">Error de Configuración</h3>
                <p className="text-muted-foreground mt-2">
                    No se ha encontrado la clave pública de Stripe.
                </p>
            </div>
        )
    }

    return (
        <>
            <VisuallyHidden>
                <DialogTitle>Configuración de Pagos Stripe</DialogTitle>
            </VisuallyHidden>

            <div className="w-full overflow-y-auto custom-scrollbar relative">
                <ConnectComponentsProvider connectInstance={connectInstance}>
                    <ConnectAccountOnboarding
                        onExit={onComplete}
                    />
                </ConnectComponentsProvider>

                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50 pointer-events-none">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
            </div>
        </>
    )
}
