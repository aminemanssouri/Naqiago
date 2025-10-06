const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkWorkerProfiles() {
  console.log('🔍 Checking worker_profiles base_location...\n');
  
  const { data: profiles, error } = await supabase
    .from('worker_profiles')
    .select('*');
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log(`Found ${profiles.length} worker profiles:`);
    profiles.forEach((profile, i) => {
      console.log(`\n${i + 1}. Business: ${profile.business_name}`);
      console.log(`   User ID: ${profile.user_id}`);
      console.log(`   Base location: ${profile.base_location}`);
      console.log(`   Current location: ${profile.current_location}`);
      console.log(`   Status: ${profile.status}`);
    });
  }
  
  // Check if we have users with worker role
  console.log('\n👥 Checking users with worker role...\n');
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'worker');
  
  if (userError) {
    console.log('❌ User Error:', userError.message);
  } else {
    console.log(`Found ${users.length} users with worker role:`);
    users.forEach((user, i) => {
      console.log(`\n${i + 1}. ${user.full_name} (ID: ${user.id})`);
    });
  }
  
  // Also check if our addresses exist
  console.log('\n🏠 Checking addresses...\n');
  const { data: addresses, error: addrError } = await supabase
    .from('addresses')
    .select('user_id, title, latitude, longitude');
  
  if (addrError) {
    console.log('❌ Address Error:', addrError.message); 
  } else {
    console.log('Addresses:');
    addresses.forEach(addr => {
      console.log(`\n   User ID: ${addr.user_id}`);
      console.log(`   Title: ${addr.title}`);
      console.log(`   Coordinates: ${addr.latitude}, ${addr.longitude}`);
    });
  }
}

checkWorkerProfiles();