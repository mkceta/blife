import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mirroring lib/pricing.ts constants
const PRICING = {
    PLATFORM_FEE_PERCENT: 0.035, // 3.5%
    STRIPE_FEE_PERCENT: 0.014, // 1.4%
    STRIPE_FIXED_FEE_CENTS: 25, // 0.25 EUR
}

function calculatePricing(sellerPriceCents: number) {
    // Logic from lib/pricing.ts
    const baseWithPlatformFee = sellerPriceCents * (1 + PRICING.PLATFORM_FEE_PERCENT)
    const numerator = baseWithPlatformFee + PRICING.STRIPE_FIXED_FEE_CENTS
    const denominator = 1 - PRICING.STRIPE_FEE_PERCENT
    const totalCents = Math.ceil(numerator / denominator)

    const platformFeeCents = Math.round(sellerPriceCents * PRICING.PLATFORM_FEE_PERCENT)

    return {
        totalCents,
        platformFeeCents,
        sellerPriceCents
    }
}

serve(async (req) => {
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
        const { totalCents, platformFeeCents } = calculatePricing(listing.price_cents)
        const applicationFee = platformFeeCents // This is what we keep as profit. 
        // Note: Stripe fees are deducted from the total automatically. 
        // With on_behalf_of, the destination charge means Stripe fees are charged to the Connected Account?
        // Actually, handling fees in Standard accounts with Destination Charges:
        //  - Platform pays Stripe fees? No.
        //  - We specify `application_fee_amount` which is what stays in Platform.
        //  - The rest goes to Seller.
        //  Wait, if we use `transfer_data`, the `amount` is the Total.
        //  Stripe fees are deducted from the `amount` before it hits the destination?
        //  Usually, Platform pays fees for Direct Charges. For Destination Charges, the Platform pays fees unless `on_behalf_of` is used?
        //  Let's stick to simple Flow:
        //  Customer pays Total.
        //  We take Application Fee (Commission).
        //  Seller gets (Total - App Fee - Stripe Fees).
        //  Wait, our formula `calculateTotalWithFees` was designed so `Total = Price + Commission + API Fees`.
        //  So `Seller gets` should be exactly `Price`.
        //  If `Total` covers everything, then `Application Fee` should be `Commission`.
        //  And Stripe takes its cut.

        //  Let's use `transfer_data`.

        // 4. Create PaymentIntent
        // For Destination Charges with Express, the Platform is responsible for Stripe fees.
        // Funds flow: Total -> Platform Balance -> (Stripe Fees deducted) -> Transfer to Destination.
        // We want Seller to receive EXACTLY listing.price_cents.
        // Transfer Amount = Total - Application Fee.
        // We want: Transfer Amount = listing.price_cents
        // Therefore: Application Fee = totalCents - listing.price_cents
        // Our 'platformFeeCents' variable previously only covered our margin, but here we need to cover the Stripe fee too.

        const applicationFeeAmount = totalCents - listing.price_cents

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCents,
            currency: 'eur',
            automatic_payment_methods: { enabled: true },
            application_fee_amount: applicationFeeAmount,
            transfer_data: {
                destination: sellerAccount.stripe_account_id,
            },
            metadata: {
                listingId: listing.id,
                buyerId: (await supabaseClient.auth.getUser()).data.user?.id,
                sellerId: listing.user_id
            }
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

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
