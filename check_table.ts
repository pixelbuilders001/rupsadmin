import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkTable() {
    const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching order_items:', error);
    } else if (data && data.length > 0) {
        console.log('Order items columns:', Object.keys(data[0]));
    } else {
        console.log('No order items found to check columns.');
    }
}

checkTable();
