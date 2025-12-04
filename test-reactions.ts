
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkReactions() {
    // Just check if we can select from reactions (even if empty) to verify table access
    const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error selecting from reactions:', error)
    } else {
        console.log('Reactions table accessible')
    }
}

checkReactions()
