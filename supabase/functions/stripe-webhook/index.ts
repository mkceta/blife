
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

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        await supabase.from('debug_logs').insert({
            source: 'stripe-webhook',
            message: 'Incoming Webhook Request',
            data: { signature_exists: !!signature, body_length: body.length }
        })
    } catch (e) {
        console.error('Failed to log init', e)
    }

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
        await supabase.from('debug_logs').insert({
            source: 'stripe-webhook',
            message: 'Signature Verification Failed',
            data: { error: err.message }
        })
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    try {
        await supabase.from('debug_logs').insert({
            source: 'stripe-webhook',
            message: `Event Verified: ${event.type}`,
            data: { eventId: event.id, type: event.type }
        })

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

                await supabase.from('debug_logs').insert({
                    source: 'stripe-webhook',
                    message: 'Processing payment_intent.succeeded',
                    data: { paymentIntentId: paymentIntent.id, metadata: paymentIntent.metadata }
                })

                // Logic for "Separate Charges and Transfers"
                // 1. Get Listing & Payout Info from metadata
                const listingId = paymentIntent.metadata?.listingId
                const sellerId = paymentIntent.metadata?.sellerId
                const buyerId = paymentIntent.metadata?.buyerId

                if (!listingId || !sellerId || !buyerId) {
                    const msg = 'PaymentIntent missing metadata for transfer logic.'
                    console.log(msg)
                    await supabase.from('debug_logs').insert({ source: 'stripe-webhook', message: msg, data: paymentIntent.metadata })
                    break
                }

                // Check for idempotency (if order already exists)
                const { data: existingOrder } = await supabase
                    .from('orders')
                    .select('id')
                    .eq('stripe_payment_intent_id', paymentIntent.id)
                    .single()

                if (existingOrder) {
                    console.log('Order already exists for this payment intent.')
                    await supabase.from('debug_logs').insert({ source: 'stripe-webhook', message: 'Order already exists', data: { orderId: existingOrder.id } })
                    break
                }

                // 2. Fetch Listing Price to calculate Payout
                const { data: listing } = await supabase
                    .from('listings')
                    .select('price_cents, user_id, title')
                    .eq('id', listingId)
                    .single()

                if (!listing) {
                    const msg = 'Listing not found for transfer.'
                    console.error(msg)
                    await supabase.from('debug_logs').insert({ source: 'stripe-webhook', message: msg, data: { listingId } })
                    break
                }

                // 3. Get Seller Stripe Account
                const { data: sellerAccount } = await supabase
                    .from('stripe_accounts')
                    .select('stripe_account_id')
                    .eq('user_id', sellerId)
                    .single()

                if (!sellerAccount?.stripe_account_id) {
                    const msg = 'Seller Stripe account not found.'
                    console.error(msg)
                    await supabase.from('debug_logs').insert({ source: 'stripe-webhook', message: msg, data: { sellerId } })
                    break
                }

                // 4. Create Transfer
                // Seller receives exactly the listing price.
                const transferAmount = listing.price_cents

                // Check available balance before transfer (Test Mode Fix)
                let balanceSufficient = true;
                try {
                    const balance = await stripe.balance.retrieve()
                    const availableEur = balance.available.find((b: any) => b.currency === 'eur')?.amount || 0
                    if (availableEur < transferAmount) {
                        console.log(`Insufficient balance: ${availableEur} < ${transferAmount}. Skipping immediate transfer.`)
                        balanceSufficient = false;
                        await supabase.from('debug_logs').insert({
                            source: 'stripe-webhook',
                            message: 'Skipping transfer due to insufficient funds (Test Mode)',
                            data: { available: availableEur, required: transferAmount }
                        })
                    }
                } catch (bErr) {
                    console.error('Error checking balance:', bErr)
                }


                let transferId = null
                let transferError = null

                if (balanceSufficient) {
                    try {
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
                        transferId = transfer.id
                        console.log(`Transfer created: ${transfer.id}`)
                    } catch (err: any) {
                        console.error(`Transfer failed: ${err.message}`)
                        transferError = err.message
                        await supabase.from('debug_logs').insert({
                            source: 'stripe-webhook',
                            message: 'Transfer Failed (Continuing flow)',
                            data: { error: err.message, code: err.code }
                        })
                        // We continue the flow without stopping. The money stays in Platform Account.
                    }
                }

                // 5. Create Order Record
                const totalAmount = paymentIntent.amount
                const platformFee = totalAmount - transferAmount

                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        listing_id: listingId,
                        buyer_id: buyerId,
                        seller_id: sellerId,
                        status: 'paid', // Paid by buyer
                        total_amount_cents: totalAmount,
                        platform_fee_cents: platformFee,
                        seller_amount_cents: transferAmount,
                        stripe_payment_intent_id: paymentIntent.id,
                        stripe_transfer_id: transferId // Can be null if failed or skipped
                    })
                    .select()
                    .single()

                if (orderError) {
                    console.error('Error creating order:', orderError)
                    await supabase.from('debug_logs').insert({ source: 'stripe-webhook', message: 'Error creating order', data: orderError })
                } else {
                    await supabase.from('debug_logs').insert({ source: 'stripe-webhook', message: 'Order created', data: { orderId: order.id, transferFailed: !!transferError } })
                }

                // 6. Update Listing Status
                const { error: updateError } = await supabase
                    .from('listings')
                    .update({ status: 'sold' })
                    .eq('id', listingId)

                if (updateError) {
                    await supabase.from('debug_logs').insert({ source: 'stripe-webhook', message: 'Error updating listing', data: updateError })
                }

                // 7. Create or Get Conversation (Thread)
                let threadId: string | null = null

                // Check if thread exists
                const { data: existingThread } = await supabase
                    .from('threads')
                    .select('id')
                    .eq('listing_id', listingId)
                    .eq('buyer_id', buyerId)
                    .eq('seller_id', sellerId)
                    .maybeSingle()

                if (existingThread) {
                    threadId = existingThread.id
                } else {
                    // Create new thread
                    const { data: newThread, error: threadError } = await supabase
                        .from('threads')
                        .insert({
                            listing_id: listingId,
                            buyer_id: buyerId,
                            seller_id: sellerId,
                            status: 'open'
                        })
                        .select()
                        .single()

                    if (newThread) {
                        threadId = newThread.id
                    } else if (threadError) {
                        console.error('Error creating thread:', threadError)
                        await supabase.from('debug_logs').insert({
                            source: 'stripe-webhook',
                            message: 'Error creating thread',
                            data: threadError
                        })
                    }
                }

                // Send Auto-Message to Thread to start conversation
                if (threadId) {
                    // We check if a message already exists to avoid duplicate auto-messages if retrying
                    const { count: msgCount } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('thread_id', threadId)

                    if (msgCount === 0) {
                        await supabase.from('messages').insert({
                            thread_id: threadId,
                            from_user: buyerId,
                            body: `¡Hola! He comprado tu artículo "${listing.title}".`,
                            type: 'text'
                        })
                    }
                }

                // 7. Send Notification to Seller
                const { error: sellerNotifError } = await supabase
                    .from('notifications')
                    .insert({
                        user_id: sellerId,
                        type: 'sale',
                        title: '¡Has vendido un artículo!',
                        message: `Tu artículo "${listing.title}" se ha vendido. Pulsa para ver el chat.`,
                        link: threadId ? `/messages/${threadId}` : `/market/orders/${order?.id}`,
                        read: false,
                        data: {
                            order_id: order?.id,
                            listing_id: listingId,
                            amount: transferAmount,
                            thread_id: threadId
                        }
                    })

                if (sellerNotifError) {
                    console.error('Error sending seller notification:', sellerNotifError)
                    await supabase.from('debug_logs').insert({
                        source: 'stripe-webhook',
                        message: 'Error sending seller notification',
                        data: sellerNotifError
                    })
                }

                // Send Notification to Buyer
                const { error: buyerNotifError } = await supabase
                    .from('notifications')
                    .insert({
                        user_id: buyerId,
                        type: 'purchase',
                        title: '¡Compra realizada con éxito!',
                        message: `Has comprado "${listing.title}". Habla con el vendedor.`,
                        link: threadId ? `/messages/${threadId}` : `/market/orders/${order?.id}`,
                        read: false,
                        data: {
                            order_id: order?.id,
                            listing_id: listingId,
                            thread_id: threadId
                        }
                    })

                if (buyerNotifError) {
                    console.error('Error sending buyer notification:', buyerNotifError)
                    await supabase.from('debug_logs').insert({
                        source: 'stripe-webhook',
                        message: 'Error sending buyer notification',
                        data: buyerNotifError
                    })
                }

                break
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object
                const buyerId = paymentIntent.metadata?.buyerId
                const listingId = paymentIntent.metadata?.listingId

                console.log(`Payment failed: ${paymentIntent.id}`)
                await supabase.from('debug_logs').insert({
                    source: 'stripe-webhook',
                    message: 'Payment Failed',
                    data: { error: paymentIntent.last_payment_error?.message, buyerId }
                })

                if (buyerId) {
                    await supabase
                        .from('notifications')
                        .insert({
                            user_id: buyerId,
                            type: 'system',
                            title: 'Error en el pago',
                            message: `Tu intento de pago para el artículo ha fallado. Por favor revisa tu tarjeta.`,
                            link: listingId ? `/market/product?id=${listingId}` : '/market',
                            read: false,
                            data: {
                                payment_intent_id: paymentIntent.id
                            }
                        })
                }
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
        await supabase.from('debug_logs').insert({ source: 'stripe-webhook', message: 'Processing Error', data: { error: err.message, stack: err.stack } })
        return new Response(JSON.stringify({ error: err.message }), { status: 400 })
    }
})
