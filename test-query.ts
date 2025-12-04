
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testQuery() {
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com', // I need a valid user to test RLS, but I don't have one. 
        // I'll try to just query without auth if RLS allows, or just check the structure.
        // Actually, I can't easily sign in as a user here without credentials.
        // I will try to run a query that doesn't require auth if possible, or just assume the query structure is the issue.
        password: 'password'
    })

    // Let's just try to select from threads with a limit 1 to see if the syntax is valid
    // We won't get data if RLS is on, but we might get a syntax error if the relationship is wrong.

    console.log("Testing query structure...")

    const { data, error } = await supabase
        .from('threads')
        .select(`
        *,
        listing:listings(id, title),
        buyer:users!threads_buyer_id_fkey(id, alias_inst),
        seller:users!threads_seller_id_fkey(id, alias_inst)
    `)
        .limit(1)

    if (error) {
        console.error('Query failed:', error)
    } else {
        console.log('Query structure seems valid (even if no data returned due to RLS/empty DB)')
    }
}

testQuery()
