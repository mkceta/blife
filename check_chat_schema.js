
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
    console.log('Checking threads table structure...');
    const { data: threads, error: threadsError } = await supabase
        .from('threads')
        .select('*')
        .limit(1);

    if (threadsError) {
        console.error('Error fetching threads:', threadsError);
    } else {
        console.log('Threads sample:', threads[0]);
    }

    console.log('Checking messages table structure...');
    const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .limit(1);

    if (messagesError) {
        console.error('Error fetching messages:', messagesError);
    } else {
        console.log('Messages sample:', messages[0]);
    }
}

checkSchema().catch(console.error);
