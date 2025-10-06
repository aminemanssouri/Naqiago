const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Try with anon key first
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function debugWorkerProfiles() {
  console.log('🔍 Debugging worker profiles access...\n');

  try {
    // Test 1: Direct query
    console.log('1. Direct worker_profiles query:');
    const { data: profiles1, error: error1, count } = await supabase
      .from('worker_profiles')
      .select('*', { count: 'exact' });

    console.log(`   Count: ${count}`);
    console.log(`   Error: ${error1?.message || 'None'}`);
    console.log(`   Data length: ${profiles1?.length || 0}`);

    // Test 2: Try with specific user_id filter
    console.log('\n2. Query with user_id filter:');
    const { data: profiles2, error: error2 } = await supabase
      .from('worker_profiles')
      .select('*')
      .eq('user_id', '95ce7a7b-fb01-4941-a385-1ee6b9b4f7b1');

    console.log(`   Error: ${error2?.message || 'None'}`);
    console.log(`   Data length: ${profiles2?.length || 0}`);
    if (profiles2?.length > 0) {
      console.log(`   Found: ${profiles2[0].business_name}`);
    }

    // Test 3: Try worker_listings view
    console.log('\n3. Query worker_listings view:');
    const { data: listings, error: error3 } = await supabase
      .from('worker_listings')
      .select('worker_id, user_id, full_name, business_name, status');

    console.log(`   Error: ${error3?.message || 'None'}`);
    console.log(`   Data length: ${listings?.length || 0}`);
    if (listings?.length > 0) {
      listings.forEach(listing => {
        console.log(`   - ${listing.full_name}: ${listing.business_name} (${listing.status})`);
      });
    }

    // Test 4: Check RLS policies
    console.log('\n4. Testing RLS bypass (if possible):');
    const { data: profiles4, error: error4 } = await supabase
      .rpc('get_worker_profiles_admin'); // This won't exist, but let's see the error

    console.log(`   RPC Error: ${error4?.message || 'None'}`);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugWorkerProfiles();