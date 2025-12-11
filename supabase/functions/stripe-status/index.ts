
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
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing environment variables')
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // Verify Auth
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        const authClient = createClient(
            supabaseUrl,
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: userError } = await authClient.auth.getUser()
        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        // Get Stripe Account ID from DB
        const adminClient = createClient(supabaseUrl, supabaseServiceKey)
        const { data: accountData } = await adminClient
            .from('stripe_accounts')
            .select('stripe_account_id')
            .eq('user_id', user.id)
            .single()

        if (!accountData?.stripe_account_id) {
            return new Response(
                JSON.stringify({ connected: false, error: 'No stripe account found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch latest status from Stripe
        const account = await stripe.accounts.retrieve(accountData.stripe_account_id)

        // Sync with DB
        await adminClient
            .from('stripe_accounts')
            .update({
                details_submitted: account.details_submitted,
                charges_enabled: account.charges_enabled,
                updated_at: new Date().toISOString(),
            })
            .eq('stripe_account_id', account.id)

        return new Response(
            JSON.stringify({
                connected: true,
                details_submitted: account.details_submitted,
                charges_enabled: account.charges_enabled
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Stripe Status Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
