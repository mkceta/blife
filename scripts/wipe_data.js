// wipe_data.js
// WARNING: This script will permanently delete ALL listings and messages.
// Use with extreme caution. Only run if you really want to wipe the data.

import { createClient } from '@supabase/supabase-js';

// Helper to create a Supabase client with service role (for admin deletions)
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
        console.error('Missing Supabase URL or KEY in environment variables');
        process.exit(1);
    }
    return createClient(url, key);
}

// Override the createClient used in the script
const supabase = getSupabase();

async function wipeAll() {
    // Use the supabase client defined at the top of the script

    // Delete all listings
    const { error: listingsError } = await supabase
        .from('listings')
        .delete()
        .neq('id', ''); // condition always true
    if (listingsError) {
        console.error('Error deleting listings:', listingsError.message);
        return;
    }
    console.log('✅ All listings deleted.');

    // Delete all messages
    const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .neq('id', '');
    if (messagesError) {
        console.error('Error deleting messages:', messagesError.message);
        return;
    }
    console.log('✅ All messages deleted.');
}

// Execute when run directly
if (require.main === module) {
    wipeAll()
        .then(() => console.log('✅ Wipe completed.'))
        .catch((e) => console.error('❌ Unexpected error:', e));
}
