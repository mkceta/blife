
import { createClient } from "npm:@supabase/supabase-js@2"
import Stripe from "npm:stripe@^14.21.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    let event
    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature!,
            webhookSecret!,
            undefined,
            cryptoProvider
        )
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        console.log(`Received event: ${event.type}`)

        switch (event.type) {
            case 'account.updated': {
                const account = event.data.object
                await supabase
                    .from('stripe_accounts')
                    .update({
                        details_submitted: account.details_submitted,
                        charges_enabled: account.charges_enabled,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('stripe_account_id', account.id)
                break
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object

                // Logic for "Separate Charges and Transfers"
                // 1. Get Listing & Payout Info from metadata
                const listingId = paymentIntent.metadata?.listingId
                const sellerId = paymentIntent.metadata?.sellerId

                if (!listingId || !sellerId) {
                    console.log('PaymentIntent missing metadata for transfer logic.')
                    break
                }

                // 2. Fetch Listing Price to calculate Payout
                const { data: listing } = await supabase
                    .from('listings')
                    .select('price_cents, user_id')
                    .eq('id', listingId)
                    .single()

                if (!listing) {
                    console.error('Listing not found for transfer.')
                    break
                }

                // 3. Get Seller Stripe Account
                const { data: sellerAccount } = await supabase
                    .from('stripe_accounts')
                    .select('stripe_account_id')
                    .eq('user_id', sellerId)
                    .single()

                if (!sellerAccount?.stripe_account_id) {
                    console.error('Seller Stripe account not found.')
                    break
                }

                // 4. Create Transfer
                // Seller receives exactly the listing price.
                // Platform keeps the rest (Customer Price - Seller Price).
                // Stripe fees are deducted from Platform balance automatically upon Charge.
                // We transfer the exact listing amount to the seller.

                const transferAmount = listing.price_cents

                console.log(`Creating transfer of ${transferAmount} cents to ${sellerAccount.stripe_account_id}`)

                const transfer = await stripe.transfers.create({
                    amount: transferAmount,
                    currency: 'eur',
                    destination: sellerAccount.stripe_account_id,
                    transfer_group: paymentIntent.transfer_group, // Link to the original charge
                    metadata: {
                        listingId: listingId,
                        originalPaymentIntent: paymentIntent.id
                    }
                })

                console.log(`Transfer created: ${transfer.id}`)

                // Optional: Mark listing as sold? handled by another event? or here?
                // Let's mark it sold here for robustness
                await supabase
                    .from('listings')
                    .update({ status: 'sold' })
                    .eq('id', listingId)

                break
            }

            default:
                console.log(`Unhandled event type ${event.type}`)
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (err: any) {
        console.error(`Webhook processing error: ${err.message}`)
        return new Response(JSON.stringify({ error: err.message }), { status: 400 })
    }
})

