
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkState() {
    console.log('Checking Order e6d3ef03-179c-44c8-a34d-d9356bca935d...');

    // 1. Get Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', 'e6d3ef03-179c-44c8-a34d-d9356bca935d')
        .single();

    if (orderError) {
        console.error('Order Error:', orderError);
        return;
    }
    console.log('Order Found:', order.id, 'Status:', order.status);

    // 2. Check Listing
    const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id, title, status')
        .eq('id', order.listing_id)
        .single();

    if (listingError) {
        console.error('Listing Error:', listingError);
    } else {
        console.log('Listing Found:', listing.title, 'Status:', listing.status);
    }

    // 3. Check Notifications for Buyer/Seller
    console.log('Checking notifications for Buyer:', order.buyer_id);
    const { data: buyNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', order.buyer_id)
        .order('created_at', { ascending: false })
        .limit(2);
    console.log('Buyer Notifications:', buyNotifs);

    console.log('Checking notifications for Seller:', order.seller_id);
    const { data: sellNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', order.seller_id)
        .order('created_at', { ascending: false })
        .limit(2);
    console.log('Seller Notifications:', sellNotifs);
}

checkState().catch(console.error);
