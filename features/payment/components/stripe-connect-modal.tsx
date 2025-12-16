'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

// ✅ DYNAMIC IMPORT - Stripe Connect only loads when user sets up selling (~50KB saved)
const StripeConnectComponent = dynamic(
    () => import('./stripe-connect-component'),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }
)

interface StripeConnectModalProps {
    accountId?: string | null
    open?: boolean
    onClose: () => void
    onComplete: () => void
}

export function StripeConnectModal({ accountId, open, onClose, onComplete }: StripeConnectModalProps) {
    // if (!accountId) return null // Removed

    return (
        <Dialog open={open ?? !!accountId} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <StripeConnectComponent
                    accountId={accountId || ''}
                    onComplete={onComplete}
                />
            </DialogContent>
        </Dialog>
    )
}
