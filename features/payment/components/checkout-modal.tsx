'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// ✅ DYNAMIC IMPORT - Stripe only loads when user opens checkout (~100KB saved)
// Re-export types for consumers
export type { CheckoutModalProps } from './checkout-modal-component'
import type { CheckoutModalProps } from './checkout-modal-component'

const CheckoutModalComponent = dynamic(
    () => import('./checkout-modal-component'),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }
)

export function CheckoutModal(props: CheckoutModalProps) {
    // Only load Stripe when modal is actually opened
    if (!props.open) return null

    return <CheckoutModalComponent {...props} />
}
