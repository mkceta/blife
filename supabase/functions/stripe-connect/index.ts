
import { createClient } from "npm:@supabase/supabase-js@2"
import Stripe from "npm:stripe@^14.21.0"

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
        // 0. Validate Environment
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
        if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is missing')

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        if (!supabaseUrl) throw new Error('SUPABASE_URL is missing')

        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')

        // 1. Initialize Stripe
        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // 2. Verify User (Auth Client)
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        const authClient = createClient(
            supabaseUrl,
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: userError } = await authClient.auth.getUser()
        if (userError || !user) {
            throw new Error(`Unauthorized: ${userError?.message || 'No user found'}`)
        }

        // 3. Admin Client for DB (Bypass RLS)
        const adminClient = createClient(supabaseUrl, supabaseServiceKey)

        // 4. Check existing account
        const { data: accountData } = await adminClient
            .from('stripe_accounts')
            .select('stripe_account_id, details_submitted')
            .eq('user_id', user.id)
            .single()

        let accountId = accountData?.stripe_account_id

        // 5. Create new Stripe Account if needed
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'ES',
                email: user.email,
                metadata: { user_id: user.id },
                capabilities: {
                    transfers: { requested: true },
                },
                business_type: 'individual',
                business_profile: {
                    mcc: '5734', // Computer Software Stores (Generic digital/marketplace goods) to avoid 'industry' prompt
                    url: 'https://blife.app',
                    product_description: 'Venta de artículos de segunda mano entre particulares en Blife.'
                }
            })
            accountId = account.id

            const { error: insertError } = await adminClient
                .from('stripe_accounts')
                .insert({ user_id: user.id, stripe_account_id: accountId })

            if (insertError) throw new Error(`DB Insert Error: ${insertError.message}`)
        }


        // 6. Generate Account Session for Embedded Onboarding
        const accountSession = await stripe.accountSessions.create({
            account: accountId,
            components: {
                payment_details: {
                    enabled: true,
                    features: {
                        refund_management: true,
                        dispute_management: true,
                        capture_payments: true,
                    }
                },
                account_onboarding: { enabled: true },
                payments: {
                    enabled: true,
                    features: {
                        refund_management: true,
                        dispute_management: true,
                        capture_payments: true,
                    }
                },
                payouts: { enabled: true }
            },
        })

        return new Response(
            JSON.stringify({ clientSecret: accountSession.client_secret }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Lambda Error:', error)
        // Return 200 with error property to surface it to client cleanly
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
