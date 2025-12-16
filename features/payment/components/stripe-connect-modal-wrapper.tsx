'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const StripeConnectModal = dynamic(() => import('./stripe-connect-modal').then(mod => ({ default: mod.StripeConnectModal })), {
    ssr: false,
    loading: () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-6" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    )
})

interface StripeConnectModalWrapperProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onExit?: () => void
}

export function StripeConnectModalWrapper(props: StripeConnectModalWrapperProps) {
    if (!props.open) return null
    return (
        <StripeConnectModal
            open={props.open}
            onClose={() => props.onOpenChange(false)}
            onComplete={props.onExit || (() => props.onOpenChange(false))}
            accountId={null}
        />
    )
}
