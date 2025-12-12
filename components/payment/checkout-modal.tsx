import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { calculateTotalWithFees } from '@/lib/pricing'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Initialize Stripe outside of component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ priceTotal, onSuccess }: { priceTotal: number, onSuccess: () => void }) {
    const stripe = useStripe()
    const elements = useElements()
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setIsLoading(true)
        setErrorMessage(null)

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required',
                confirmParams: {
                    return_url: `${window.location.origin}/market/order/success`,
                },
            })

            if (error) {
                setErrorMessage(error.message || 'Error desconocido en el pago')
                setIsLoading(false)
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Payment succeeded without redirect
                setIsSuccess(true)
                // Wait a bit to show animation then optional callback or just let user close
            } else {
                // Pending or processing, usually handled by redirect, but if we are here
                // it might be 'processing'.
                // If redirect happened, this code won't be reached.
                setIsLoading(false)
            }
        } catch (e: any) {
            console.error(e)
            setErrorMessage(e.message)
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6"
                >
                    <motion.div
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <Check className="w-12 h-12 text-green-600 dark:text-green-400" strokeWidth={3} />
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-2xl font-bold mb-2">¡Pago realizado con éxito!</h2>
                    <p className="text-muted-foreground mb-8">
                        Tu pedido ha sido procesado correctamente.
                    </p>

                    <Button
                        onClick={() => {
                            onSuccess()
                            router.push('/market') // Or to orders page
                        }}
                        className="w-full h-12 text-base"
                    >
                        Entendido
                    </Button>
                </motion.div>
            </div>
        )
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

            if (data?.error) {
                throw new Error(data.error)
            }
            if (error) {
                try {
                    const body = await error.context.json()
                    if (body.error) throw new Error(body.error)
                } catch {
                    // ignore
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
                {/* Remove Header/Title if we want full custom success view or keep it. 
                     Let's keep Title for form, but maybe hide it for success?
                     Actually DialogTitle is required for specific accessibility in some versions, but we can visually hide or just change it.
                  */}
                {!loading && clientSecret ? (
                    // We render title inside form or here? Elements provider needs to wrap CheckOutForm
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                        {/* We pass a custom 'Wrapper' or handle title inside CheckoutForm better? 
                            Let's just put the DialogHeader inside checkout form or wrap it conditionally? 
                            Cannot put Elements inside DialogHeader.
                            I will just render DialogHeader here.
                        */}
                        <CheckoutFormWrapper
                            loading={loading}
                            clientSecret={clientSecret}
                            totalToPay={totalToPay}
                            onSuccess={() => onOpenChange(false)}
                        />
                    </Elements>
                ) : (
                    <>
                        <DialogTitle className="text-center mt-4">Cargando...</DialogTitle>
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

function CheckoutFormWrapper({ loading, clientSecret, totalToPay, onSuccess }: any) {
    // This wrapper allows us to use useStripe context if we needed to access it up here,
    // but mainly it's to have a clean render for the Title vs Success state if we wanted to lift state up.
    // However, since state is in CheckoutForm, let's just make CheckoutForm handle the header too or just keep header generic.

    // Actually, looking at previous code, DialogHeader was static.
    // Let's bring back DialogHeader but maybe make it conditional inside CheckoutForm? 
    // No, CheckoutForm is inside Elements.

    // Let's just render the Header always, but maybe change text?
    // It's easier if we just render "Completar compra" and if success, we treat it as fine.

    return (
        <>
            <DialogTitle className="text-center font-bold text-xl mb-2">
                Completar compra
            </DialogTitle>
            <CheckoutForm
                priceTotal={totalToPay}
                onSuccess={onSuccess}
            />
        </>
    )
}
