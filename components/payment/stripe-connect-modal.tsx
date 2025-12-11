'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ConnectComponentsProvider, ConnectAccountOnboarding } from "@stripe/react-connect-js"
import { loadConnectAndInitialize } from "@stripe/connect-js"
import { createClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface StripeConnectModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onExit?: () => void
}

export function StripeConnectModal({ open, onOpenChange, onExit }: StripeConnectModalProps) {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)

    const connectInstance = useMemo(() => {
        return loadConnectAndInitialize({
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden bg-background border-zinc-800" aria-describedby={undefined}>
                <VisuallyHidden>
                    <DialogTitle>Configuración de Pagos Stripe</DialogTitle>
                </VisuallyHidden>

                <div className="w-full h-full overflow-y-auto custom-scrollbar relative">
                    <ConnectComponentsProvider connectInstance={connectInstance}>
                        <ConnectAccountOnboarding
                            onExit={() => {
                                onOpenChange(false)
                                if (onExit) onExit()
                            }}
                        />
                    </ConnectComponentsProvider>

                    {/* Fallback loader if ConnectJS takes time or fetchClientSecret is running */}
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-50 pointer-events-none">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
