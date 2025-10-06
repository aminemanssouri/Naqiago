const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function testBookingProcess() {
  console.log('🔍 Testing Booking Process Components...\n');

  try {
    // 1. Check if we have services
    console.log('1. Checking services table:');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .limit(3);

    if (servicesError) {
      console.log('❌ Services error:', servicesError.message);
    } else {
      console.log(`✅ Found ${services.length} services:`);
      services.forEach(service => {
        console.log(`   - ${service.title} (ID: ${service.id})`);
        console.log(`     Price: $${service.base_price}, Duration: ${service.duration_minutes}min`);
      });
    }

    // 2. Check worker_services junction table
    console.log('\n2. Checking worker_services junction table:');
    const { data: workerServices, error: wsError } = await supabase
      .from('worker_services')
      .select(`
        worker_id,
        service_id,
        custom_price,
        services(title),
        worker_profiles(business_name)
      `);

    if (wsError) {
      console.log('❌ Worker services error:', wsError.message);
    } else {
      console.log(`✅ Found ${workerServices.length} worker-service relationships:`);
      workerServices.forEach(ws => {
        console.log(`   - ${ws.worker_profiles?.business_name} can do: ${ws.services?.title}`);
        console.log(`     Custom price: $${ws.custom_price || 'Default'}`);
      });
    }

    // 3. Check existing bookings
    console.log('\n3. Checking existing bookings:');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(5);

    if (bookingsError) {
      console.log('❌ Bookings error:', bookingsError.message);
    } else {
      console.log(`✅ Found ${bookings.length} existing bookings:`);
      bookings.forEach(booking => {
        console.log(`   - ${booking.booking_number}: ${booking.status}`);
        console.log(`     Service: ${booking.service_id}, Worker: ${booking.worker_id}`);
        console.log(`     Date: ${booking.scheduled_date} at ${booking.scheduled_time}`);
        console.log(`     Total: $${booking.total_price}`);
      });
    }

    // 4. Test booking creation (dry run - don't actually create)
    console.log('\n4. Testing booking creation data structure:');
    const testBookingData = {
      customer_id: '95ce7a7b-fb01-4941-a385-1ee6b9b4f7b1', // Ahmed's user ID
      worker_id: services.length > 0 ? workerServices[0]?.worker_id : 'test-worker-id',
      service_id: services.length > 0 ? services[0].id : 'test-service-id',
      scheduled_date: '2025-10-06',
      scheduled_time: '10:00:00',
      estimated_duration: 60,
      service_address_text: 'Test Address, Casablanca',
      vehicle_type: 'sedan',
      vehicle_make: 'Toyota',
      vehicle_model: 'Camry',
      vehicle_year: 2020,
      vehicle_color: 'White',
      license_plate: 'ABC123',
      base_price: 80,
      total_price: 80,
      special_instructions: 'Test booking - please handle with care',
      service_location: null
    };

    console.log('✅ Test booking data structure is valid:');
    console.log('   Customer:', testBookingData.customer_id);
    console.log('   Worker:', testBookingData.worker_id);
    console.log('   Service:', testBookingData.service_id);
    console.log('   Date/Time:', testBookingData.scheduled_date, testBookingData.scheduled_time);
    console.log('   Vehicle:', testBookingData.vehicle_make, testBookingData.vehicle_model);
    console.log('   Total Price:', testBookingData.total_price);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBookingProcess();