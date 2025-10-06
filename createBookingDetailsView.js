const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://bwqgjtvmruefphwtoxpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cWdqdHZtcnVlZnBod3RveHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MzEyNjUsImV4cCI6MjA0NjMwNzI2NX0.zAKsq2vJRJWrLaUu02Wx0YfOeW5vvlNQTWEPGONxL5E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBookingDetailsView() {
  console.log('🔍 Creating booking_details view...');
  
  const viewSQL = `
    CREATE OR REPLACE VIEW booking_details AS
    SELECT 
      b.*,
      cp.full_name as customer_name,
      cp.phone as customer_phone,
      wp.business_name as worker_name,
      w_user.full_name as worker_full_name,
      w_user.avatar_url as worker_avatar_url,
      s.title as service_name,
      s.key as service_key,
      COALESCE(wp.hourly_rate, 0) as worker_hourly_rate
    FROM bookings b
    LEFT JOIN profiles cp ON b.customer_id = cp.id
    LEFT JOIN worker_profiles wp ON b.worker_id = wp.id
    LEFT JOIN profiles w_user ON wp.user_id = w_user.id
    LEFT JOIN services s ON b.service_id = s.id;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query: viewSQL });
  
  if (error) {
    console.error('❌ Error creating view:', error);
  } else {
    console.log('✅ booking_details view created successfully');
  }
}

async function testBookingDetailsView() {
  console.log('🔍 Testing booking_details view...');
  
  const { data, error } = await supabase
    .from('booking_details')
    .select('*')
    .limit(5);
  
  if (error) {
    console.error('❌ Error querying view:', error);
  } else {
    console.log('✅ View query successful, found', data?.length, 'bookings');
    if (data && data.length > 0) {
      console.log('📋 Sample booking:', JSON.stringify(data[0], null, 2));
    }
  }
}

async function main() {
  await createBookingDetailsView();
  await testBookingDetailsView();
}

main().catch(console.error);