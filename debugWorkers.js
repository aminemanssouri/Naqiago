const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function debugWorkers() {
  console.log('🔍 Debugging workers data...\n');

  try {
    // 1. Check worker_profiles table directly
    console.log('1. Checking worker_profiles table:');
    const { data: profiles, error: profilesError } = await supabase
      .from('worker_profiles')
      .select('*');
    
    if (profilesError) {
      console.log('❌ worker_profiles error:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles.length} worker profiles:`);
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ID: ${profile.id}`);
        console.log(`      User ID: ${profile.user_id}`);
        console.log(`      Business: ${profile.business_name || 'No business name'}`);
        console.log(`      Status: ${profile.status}`);
        console.log(`      Bio: ${profile.bio ? profile.bio.substring(0, 50) + '...' : 'No bio'}`);
        console.log(`      Experience: ${profile.experience_years} years`);
        console.log('      ---');
      });
    }

    // 2. Check profiles table for user info
    console.log('\n2. Checking profiles table for user info:');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'worker');
    
    if (usersError) {
      console.log('❌ profiles error:', usersError.message);
    } else {
      console.log(`✅ Found ${users.length} users with worker role:`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.full_name} (ID: ${user.id})`);
      });
    }

    // 3. Check worker_listings view (if it exists)
    console.log('\n3. Checking worker_listings view:');
    const { data: listings, error: listingsError } = await supabase
      .from('worker_listings')
      .select('*');
    
    if (listingsError) {
      console.log('❌ worker_listings error:', listingsError.message);
    } else {
      console.log(`✅ Found ${listings.length} worker listings:`);
      listings.forEach((listing, index) => {
        console.log(`   ${index + 1}. Name: ${listing.full_name}`);
        console.log(`      Worker ID: ${listing.worker_id}`);
        console.log(`      User ID: ${listing.user_id}`);
        console.log(`      Status: ${listing.status}`);
        console.log(`      Rating: ${listing.worker_rating}`);
        console.log(`      Business: ${listing.business_name || 'No business name'}`);
        console.log('      ---');
      });
    }

    // 4. Test the current workers query
    console.log('\n4. Testing current workers query (status = available):');
    const { data: availableWorkers, error: availableError } = await supabase
      .from('worker_listings')
      .select('*')
      .eq('status', 'available');
    
    if (availableError) {
      console.log('❌ Available workers query error:', availableError.message);
    } else {
      console.log(`✅ Available workers query returned ${availableWorkers.length} workers`);
      availableWorkers.forEach((worker, index) => {
        console.log(`   ${index + 1}. ${worker.full_name} (Status: ${worker.status})`);
      });
    }

    // 5. Test query without status filter
    console.log('\n5. Testing query without status filter:');
    const { data: allWorkers, error: allError } = await supabase
      .from('worker_listings')
      .select('*');
    
    if (allError) {
      console.log('❌ All workers query error:', allError.message);
    } else {
      console.log(`✅ All workers query returned ${allWorkers.length} workers`);
      allWorkers.forEach((worker, index) => {
        console.log(`   ${index + 1}. ${worker.full_name} (Status: ${worker.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugWorkers();