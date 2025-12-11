import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log('Checking reactions table schema...')
    try {
        // Try to insert a dummy reaction to see if it complains about missing column
        // actually accessing information_schema via standard client is hard due to permissions.
        // Let's just try to select 'emoji' from reactions.
        const { data, error } = await supabase
            .from('reactions')
            .select('emoji')
            .limit(1)

        if (error) {
            console.error('Error selecting emoji:', error)
        } else {
            console.log('Successfully selected emoji column. Data:', data)
        }
    } catch (e) {
        console.error('Exception:', e)
    }
}

checkSchema()
