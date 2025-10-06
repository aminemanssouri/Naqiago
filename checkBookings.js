const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://bwqgjtvmruefphwtoxpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cWdqdHZtcnVlZnBod3RveHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MzEyNjUsImV4cCI6MjA0NjMwNzI2NX0.zAKsq2vJRJWrLaUu02Wx0YfOeW5vvlNQTWEPGONxL5E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookings() {
  console.log('🔍 Checking bookings in database...');
  
  try {
    // First, let's see if there are any bookings at all
    const { data: allBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(10);
    
    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError);
      return;
    }
    
    console.log('📊 Total bookings found:', allBookings?.length || 0);
    
    if (allBookings && allBookings.length > 0) {
      console.log('\n📋 First booking details:');
      console.log(JSON.stringify(allBookings[0], null, 2));
    } else {
      console.log('❌ No bookings found in database!');
      console.log('💡 This means you need to create some test bookings first.');
    }

    // Also check the profiles to see what users exist
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log('\n👤 Available user profiles:');
      profiles?.forEach(profile => {
        console.log(`- ID: ${profile.id}, Name: ${profile.full_name}, Email: ${profile.email}`);
      });
    }

    // Check if we can actually query with joins
    console.log('\n🔍 Testing bookings with joins...');
    const { data: joinedBookings, error: joinError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:profiles!customer_id(full_name, phone, avatar_url),
        worker:worker_profiles!worker_id(
          id,
          business_name,
          user:profiles!worker_profiles_user_id_fkey(full_name, avatar_url)
        ),
        service:services!service_id(title, key, price)
      `)
      .limit(3);

    if (joinError) {
      console.error('❌ Error with joins:', joinError);
    } else {
      console.log('✅ Join query successful, found', joinedBookings?.length, 'bookings');
      if (joinedBookings && joinedBookings.length > 0) {
        console.log('\n📋 Sample joined booking:');
        console.log(JSON.stringify(joinedBookings[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Connection error:', error);
  }
}

checkBookings();