
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLogs() {
    console.log('Inserting test log...')
    const { error: insertError } = await supabase.from('debug_logs').insert({
        source: 'local-script',
        message: 'Test log from verification script'
    })
    if (insertError) console.error('Error inserting test log:', insertError)

    console.log('Checking debug_logs...')
    const { data, error } = await supabase
        .from('debug_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error fetching logs:', error)
        return
    }

    console.log('Recent logs:')
    data.forEach(log => {
        console.log(`[${log.created_at}] [${log.source}]: ${log.message}`)
        if (log.data) console.log('Data:', JSON.stringify(log.data, null, 2))
        console.log('---')
    })
}

; (async () => {
    await checkLogs()
})()
