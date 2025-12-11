import { createClient } from "@supabase/supabase-js"
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars. Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
    const args = process.argv.slice(2)
    const command = args[0]

    if (command === 'status') {
        await checkStatus()
    } else if (command === 'reset') {
        const userId = args[1]
        if (!userId) {
            console.error('Usage: status | reset <user_id> | mock-verify <user_id>')
            return
        }
        await resetUser(userId)
    } else if (command === 'mock-verify') {
        const userId = args[1]
        if (!userId) {
            console.error('Usage: status | reset <user_id> | mock-verify <user_id>')
            return
        }
        await mockVerifyUser(userId)
    } else {
        console.log('Available commands:')
        console.log('  npx tsx scripts/test-functions.ts status')
        console.log('  npx tsx scripts/test-functions.ts reset <user_id>')
        console.log('  npx tsx scripts/test-functions.ts mock-verify <user_id>')
    }
}

async function checkStatus() {
    console.log('--- Stripe Accounts Status ---')
    const { data: accounts, error } = await supabase
        .from('stripe_accounts')
        .select(`
            stripe_account_id,
            details_submitted,
            charges_enabled,
            created_at,
            user_id
        `)

    if (error) {
        console.error('Error fetching accounts:', error)
        return
    }

    if (accounts.length === 0) {
        console.log('No stripe accounts found.')
    } else {
        console.table(accounts)
    }
}

async function resetUser(userId: string) {
    console.log(`Resetting Stripe Account for User: ${userId}`)

    // 1. Get the account ID to display (optional)
    const { data: existing } = await supabase
        .from('stripe_accounts')
        .select('stripe_account_id')
        .eq('user_id', userId)
        .single()

    if (existing) {
        console.log(`Found existing Stripe Account: ${existing.stripe_account_id}`)
        // Note: Real deletion from Stripe Platform requires Secret Key and API call, 
        // which we can't do easily here without importing 'stripe' sdk and key.
        // But for testing the APP FLOW, deleting from DB is enough to make the App think the user is new.

        const { error } = await supabase
            .from('stripe_accounts')
            .delete()
            .eq('user_id', userId)

        if (error) console.error('Delete failed:', error)
        else console.log('✅ Deleted from DB. User will be prompted to create new account.')
    } else {
        console.log('No existing account found for this user.')
    }
}

async function mockVerifyUser(userId: string) {
    console.log(`MOCKING Verification for User: ${userId}`)

    const { data, error } = await supabase
        .from('stripe_accounts')
        .update({
            charges_enabled: true,
            details_submitted: true,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()

    if (error) {
        console.error('Update failed:', error)
    } else {
        console.log('✅ User manually verified in DB.')
        console.log(data)
    }
}

main()
