---
description: Deploying Stripe Payment System
---

# Deploy Guidelines

You have implemented the Stripe Connect payment system. Follow these steps to deploy it to your Supabase project.

## 1. Link Supabase Project
Run the following command and select your project `blife` (or equivalent):
```bash
npx supabase link
```
Enter your database password if prompted.

## 2. Apply Database Changes
Push the new tables (`stripe_accounts`, `orders`) and columns (`brand`, `size`, `condition`):
```bash
npx supabase db push
```

## 3. Deploy Edge Functions
Deploy the backend logic for payments:
```bash
npx supabase functions deploy stripe-connect
npx supabase functions deploy stripe-webhook
npx supabase functions deploy create-payment-intent
```

## 4. Set Environment Variables
Go to your **Supabase Dashboard > Settings > Edge Functions** (or simply use `.env` if testing locally via `supabase start`) and set the following secrets:
- `STRIPE_SECRET_KEY`: Your Stripe Secret Key (sk_test_...)
- `STRIPE_WEBHOOK_SECRET`: The secret for your webhook endpoint (whsec_...)
- `SUPABASE_URL`: Your project URL
- `SUPABASE_ANON_KEY`: Your project Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Service Role Key (for webhooks)

Also ensure your **Vercel/Next.js environment** has:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe Public Key (pk_test_...)

## 5. Webhook Configuration
In your **Stripe Dashboard > Developers > Webhooks**:
- Add an endpoint pointing to: `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
- Select events: `account.updated`.

## Verification
1. Go to your Profile > Pagos/Vender.
2. Click to connect Stripe.
3. Complete onboarding (use test data).
4. Go to a product (created by another user).
5. Click "Comprar".
6. Verify the checkout modal appears and accepts payment.
