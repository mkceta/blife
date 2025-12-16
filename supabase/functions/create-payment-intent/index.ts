
import { createClient } from "npm:@supabase/supabase-js@2"
import Stripe from "npm:stripe@^14.21.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Parse Request
        const { listingId } = await req.json()

        // 1. Get Listing & Seller Info
        const { data: listing, error: listingError } = await supabaseClient
            .from('listings')
            .select('*, user:user_id(id)')
            .eq('id', listingId)
            .single()

        if (listingError || !listing) throw new Error('Listing not found')

        // 2. Get Seller's Stripe Account
        const { data: sellerAccount, error: accountError } = await supabaseClient
            .from('stripe_accounts')
            .select('stripe_account_id, charges_enabled')
            .eq('user_id', listing.user_id)
            .single()

        // Check if seller can receive payments
        if (!sellerAccount || !sellerAccount.charges_enabled) {
            throw new Error('Seller has not set up payments yet.')
        }

        // 3. Calculate Amounts
        const PLATFORM_FEE_PERCENT = 0.035 // 3.5%
        const STRIPE_FEE_PERCENT = 0.014 // 1.4% + 0.25€
        const STRIPE_FIXED_FEE_CENTS = 25

        const sellerPriceCents = listing.price_cents

        const baseWithPlatformFee = sellerPriceCents * (1 + PLATFORM_FEE_PERCENT)
        const numerator = baseWithPlatformFee + STRIPE_FIXED_FEE_CENTS
        const denominator = 1 - STRIPE_FEE_PERCENT
        const totalCents = Math.ceil(numerator / denominator)

        const platformFeeCents = Math.round(sellerPriceCents * PLATFORM_FEE_PERCENT)

        // Ensure Seller gets exact price
        const applicationFeeAmount = totalCents - sellerPriceCents

        // Verify Buyer Auth
        const { data: { user: buyer }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !buyer) {
            throw new Error('User not authenticated')
        }

        // 4. Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCents,
            currency: 'eur',
            automatic_payment_methods: { enabled: true },
            metadata: {
                listingId: listing.id,
                buyerId: buyer.id,
                sellerId: listing.user_id
            },
            transfer_group: listing.id // IMPORTANT: Link charge to future transfer
        })

        return new Response(
            JSON.stringify({
                clientSecret: paymentIntent.client_secret,
                priceBreakdown: {
                    total: totalCents,
                    subtotal: listing.price_cents,
                    fee: platformFeeCents
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: unknown) {
        console.error('Payment Intent Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

