
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

async function checkTypes() {
    console.log('Fetching distinct notification types...');
    // We can't use 'distinct' easily with js client select, so we fetch standard rows and distinct in js.
    // Or use .rpc if available, but unlikely.
    const { data, error } = await supabase
        .from('notifications')
        .select('type')
        .limit(1000); // Should be enough to find the outlier

    if (error) {
        console.error('Error:', error);
        return;
    }

    const types = [...new Set(data.map(d => d.type))];
    console.log('Found types:', types);
}

checkTypes().catch(console.error);
