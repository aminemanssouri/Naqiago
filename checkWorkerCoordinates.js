const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkWorkerCoordinates() {
  console.log('🗺️  Checking current worker coordinates in database...\n');

  try {
    // Get both workers from worker_listings view
    const { data: workers, error } = await supabase
      .from('worker_listings')
      .select('*');

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log(`✅ Found ${workers.length} workers:`);
      workers.forEach((worker, i) => {
        console.log(`\n${i + 1}. ${worker.full_name}`);
        console.log(`   User ID: ${worker.user_id}`);
        console.log(`   Business: ${worker.business_name}`);
        console.log(`   Status: ${worker.status}`);
        
        // Check all possible coordinate fields
        const fields = Object.keys(worker);
        const coordFields = fields.filter(field => 
          field.toLowerCase().includes('lat') || 
          field.toLowerCase().includes('lng') || 
          field.toLowerCase().includes('lon') ||
          field.toLowerCase().includes('location')
        );
        
        console.log(`   Coordinate fields:`, coordFields);
        coordFields.forEach(field => {
          console.log(`     ${field}: ${worker[field]}`);
        });
      });
    }

    // Also check the raw database data
    console.log('\n📍 Raw worker profile locations:');
    const { data: profiles, error: profileError } = await supabase
      .from('worker_profiles')
      .select(`
        user_id,
        business_name,
        base_location,
        current_location
      `);

    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
    } else {
      profiles.forEach(profile => {
        console.log(`\n   ${profile.business_name}`);
        console.log(`   User ID: ${profile.user_id}`);
        console.log(`   Base location: ${profile.base_location}`);
        console.log(`   Current location: ${profile.current_location}`);
      });
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

checkWorkerCoordinates();