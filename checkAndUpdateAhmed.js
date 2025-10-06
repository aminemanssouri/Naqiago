const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkAndUpdateAhmedAddress() {
  const ahmedUserId = '95ce7a7b-fb01-4941-a385-1ee6b9b4f7b1';
  
  console.log('🔍 Checking Ahmed Hassan\'s address and location...\n');

  try {
    // 1. Check if Ahmed has an address
    console.log('1. Checking addresses table:');
    const { data: addresses, error: addressError } = await supabase
      .from('addresses')
      .select(`
        id,
        title,
        address_line_1,
        city,
        latitude,
        longitude,
        is_default
      `)
      .eq('user_id', ahmedUserId);

    if (addressError) {
      console.log('❌ Address query error:', addressError.message);
    } else {
      console.log(`✅ Found ${addresses.length} addresses for Ahmed:`);
      addresses.forEach((addr, i) => {
        console.log(`   ${i + 1}. ${addr.title}`);
        console.log(`      Address: ${addr.address_line_1}, ${addr.city}`);
        console.log(`      Coordinates: ${addr.latitude}, ${addr.longitude}`);
        console.log(`      Default: ${addr.is_default}`);
        console.log('      ---');
      });
    }

    // 2. Check worker profile location
    console.log('\n2. Checking worker profile location:');
    const { data: workerProfile, error: workerError } = await supabase
      .from('worker_profiles')
      .select('base_location, current_location, business_name')
      .eq('user_id', ahmedUserId)
      .single();

    if (workerError) {
      console.log('❌ Worker profile error:', workerError.message);
    } else {
      console.log('✅ Worker profile found:');
      console.log(`   Business: ${workerProfile.business_name}`);
      console.log(`   Base location: ${workerProfile.base_location}`);
      console.log(`   Current location: ${workerProfile.current_location}`);
    }

    // 3. Check worker_listings view to see coordinates
    console.log('\n3. Checking worker_listings view coordinates:');
    const { data: listing, error: listingError } = await supabase
      .from('worker_listings')
      .select('full_name, worker_latitude, worker_longitude, business_name')
      .eq('user_id', ahmedUserId)
      .single();

    if (listingError) {
      console.log('❌ Worker listings error:', listingError.message);
    } else {
      console.log('✅ Worker listing coordinates:');
      console.log(`   Name: ${listing.full_name}`);
      console.log(`   Business: ${listing.business_name}`);
      console.log(`   Latitude: ${listing.worker_latitude}`);
      console.log(`   Longitude: ${listing.worker_longitude}`);
    }

    // 4. If no address exists, create one
    if (!addresses || addresses.length === 0) {
      console.log('\n4. 📍 Creating address for Ahmed Hassan...');
      
      const { data: newAddress, error: insertError } = await supabase
        .from('addresses')
        .insert({
          user_id: ahmedUserId,
          title: 'Ahmed Professional Car Wash - Main Location',
          address_line_1: 'Boulevard Mohammed V, Quartier Administratif',
          address_line_2: 'Near Hassan II Mosque',
          city: 'Casablanca',
          state: 'Casablanca-Settat',
          postal_code: '20250',
          country: 'Morocco',
          latitude: 33.5975,  // Different from other worker
          longitude: -7.6185,
          is_default: true
        })
        .select()
        .single();

      if (insertError) {
        console.log('❌ Failed to create address:', insertError.message);
      } else {
        console.log('✅ Address created successfully!');
        console.log(`   Address ID: ${newAddress.id}`);
        console.log(`   Location: ${newAddress.latitude}, ${newAddress.longitude}`);
      }
    } else {
      console.log('\n4. ✅ Ahmed already has an address');
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

checkAndUpdateAhmedAddress();