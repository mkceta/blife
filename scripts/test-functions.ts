import { createClient } from "@supabase/supabase-js"
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// --- CONFIG ---
const PROJECT_URL = 'https://ixcjzqipexsawgpinjli.supabase.co'; // Got this from your function deployment warnings
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Note: We need a valid ACCESS_TOKEN to test 'stripe-connect' because it requires auth.
// Without an access token, we can only verify the function is reachable and returns 401/400, not 500.

if (!SUPABASE_ANON_KEY) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment.');
    process.exit(1);
}

const supabase = createClient(PROJECT_URL, SUPABASE_ANON_KEY);

async function testStripeConnect() {
    console.log('\n--- Testing stripe-connect ---');
    console.log('Invoking function without auth (Expect 400/401, NOT 500)...');

    const start = Date.now();
    const { data, error } = await supabase.functions.invoke('stripe-connect', {
        headers: {
            // No auth header
        }
    });
    const duration = Date.now() - start;

    console.log(`Duration: ${duration}ms`);

    if (error) {
        console.log('Status:', error);
        // "Missing Authorization header" comes from our code => FUNCTION IS RUNNING!
        // "Edge Function returned a non-2xx status code" with log details => MIGHT BE RUNNING but threw error.

        // Use raw fetch to inspect status code accurately if supabase client masks it.
    } else {
        console.log('Response:', data);
    }

    // Manual Verify
    const res = await fetch(`${PROJECT_URL}/functions/v1/stripe-connect`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, // Valid Anon, but Invalid User Token in 'Authorization' header for the function logic
        }
    });

    const text = await res.text();
    console.log(`Raw Fetch Status: ${res.status}`);
    console.log(`Raw Fetch Body: ${text}`);

    if (res.status === 200 && text.includes("Missing Authorization header")) {
        console.log('✅ PASS: Function is running and handled missing auth correctly.');
    } else if (res.status === 500 || text.includes("Deno.core.runMicrotasks")) {
        console.log('❌ FAIL: Function crashed with runtime error.');
    } else {
        console.log('⚠️ UNKNOWN: Check logs.');
    }
}

async function testCreatePaymentIntent() {
    console.log('\n--- Testing create-payment-intent ---');
    console.log('Invoking function with invalid body (Expect error handled, NOT 500)...');

    const res = await fetch(`${PROJECT_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ listingId: 'fake-id' })
    });

    const text = await res.text();
    console.log(`Raw Fetch Status: ${res.status}`);
    console.log(`Raw Fetch Body: ${text}`);

    // We expect "Listing not found" or "Unauthorized" or something handled.
    // If we get "Deno.core.runMicrotasks" it failed.

    if (text.includes("Deno.core.runMicrotasks")) {
        console.log('❌ FAIL: Function crashed with runtime error.');
    } else if (res.status === 200 || res.status === 400) {
        console.log('✅ PASS: Function is running (logic error expected).');
    }
}

async function run() {
    await testStripeConnect();
    await testCreatePaymentIntent();
}

run();
