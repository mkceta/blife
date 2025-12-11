# 🚀 Desplegar Edge Function - Stripe Status

Esta función es necesaria para verificar el estado de la cuenta de Stripe inmediatamente después del onboarding, evitando esperas por webhooks.

## 📋 Pasos para Desplegar

### 1. Abrir Supabase Dashboard
1. Ve a: [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **BLife**

### 2. Ir a Edge Functions
1. En el menú lateral izquierdo, busca **"Edge Functions"**
2. Click en **"Create a new function"**

### 3. Configurar la Función

**Name**: `stripe-status`

**Code**: Copia TODO el código de abajo:

```typescript
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
```

### 4. Deploy
1. Click en **"Deploy function"**

### 5. Verificar Variables de Entorno
Asegúrate de que las siguientes variables estén configuradas en las settings de la función (o globalmente en el proyecto):
- `STRIPE_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (usualmente disponible por defecto, pero verifica si necesitas añadirla)

¡Listo! La aplicación ahora podrá verificar tu cuenta instantáneamente.
