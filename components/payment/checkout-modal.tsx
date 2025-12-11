'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { calculateTotalWithFees } from '@/lib/pricing'

// Initialize Stripe outside of component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ priceTotal, onSuccess }: { priceTotal: number, onSuccess: () => void }) {
    const stripe = useStripe()
    const elements = useElements()
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setIsLoading(true)
        setErrorMessage(null)

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/market/order/success`,
            },
        })

        if (error) {
            setErrorMessage(error.message || 'Error desconocido en el pago')
            setIsLoading(false)
        } else {
            // Your customer will be redirected to your `return_url`.
            onSuccess()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <PaymentElement />
            {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}

            <Button
                type="submit"
                disabled={!stripe || isLoading}
                className="w-full h-12 text-base font-semibold"
            >
                {isLoading ? 'Procesando...' : `Pagar ${(priceTotal / 100).toFixed(2)} €`}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
                Tus datos están protegidos por Stripe. El vendedor no recibirá el dinero hasta que confirmes la recepción.
            </p>
        </form>
    )
}

export function CheckoutModal({
    open,
    onOpenChange,
    listingId,
    priceCents
}: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    listingId: string,
    priceCents: number
}) {
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const totalToPay = calculateTotalWithFees(priceCents)

    useEffect(() => {
        if (open && !clientSecret) {
            fetchPaymentIntent()
        }
    }, [open])

    const fetchPaymentIntent = async () => {
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                toast.error('Debes iniciar sesión para comprar')
                onOpenChange(false)
                return
            }

            const { data, error } = await supabase.functions.invoke('create-payment-intent', {
                body: { listingId },
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            })

            // Invoke returns generic error for 400/500, but let's check explicitly for data.error if it returns 200 with error body
            if (data?.error) {
                throw new Error(data.error)
            }
            // Also check 'error' from invoke
            if (error) {
                // Try to parse the error message if it's a FunctionsHttpError
                try {
                    const body = await error.context.json()
                    if (body.error) throw new Error(body.error)
                } catch {
                    // ignore JSON parse error
                }
                throw error
            }
            if (data?.clientSecret) {
                setClientSecret(data.clientSecret)
            }
        } catch (error: any) {
            console.error('Error creating payment intent:', error)
            toast.error(error.message || 'Error al iniciar el pago')
            onOpenChange(false)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Completar compra</DialogTitle>
                </DialogHeader>

                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}

                {!loading && clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                        <CheckoutForm
                            priceTotal={totalToPay}
                            onSuccess={() => onOpenChange(false)}
                        />
                    </Elements>
                )}
            </DialogContent>
        </Dialog>
    )
}
