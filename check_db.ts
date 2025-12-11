
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function check() {
    const { data: posts } = await supabase.from('posts').select('*').limit(1)
    console.log('Posts:', Object.keys(posts?.[0] || {}))
    const { data: comments } = await supabase.from('comments').select('*').limit(1)
    console.log('Comments:', Object.keys(comments?.[0] || {}))
}

check()
