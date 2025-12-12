// wipe_data.ts
// WARNING: This script will permanently delete ALL listings and messages.
// Use with extreme caution. Only run if you really want to wipe the data.

import { createClient } from '@/lib/supabase-server';

async function wipeAll() {
    const supabase = await createClient();
    // Delete all listings
    const { error: listingsError } = await supabase.from('listings').delete().neq('id', '');
    if (listingsError) {
        console.error('Error deleting listings:', listingsError.message);
        return;
    }
    console.log('All listings deleted.');

    // Delete all messages
    const { error: messagesError } = await supabase.from('messages').delete().neq('id', '');
    if (messagesError) {
        console.error('Error deleting messages:', messagesError.message);
        return;
    }
    console.log('All messages deleted.');
}

// Execute when run directly
if (require.main === module) {
    wipeAll()
        .then(() => console.log('Wipe completed.'))
        .catch((e) => console.error('Unexpected error:', e));
}
