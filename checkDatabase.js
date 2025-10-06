const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = 'https://zyxrtoepfevcdlmjxstq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5eHJ0b2VwZmV2Y2RsbWp4c3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0OTc3NjksImV4cCI6MjA0OTA3Mzc2OX0.NWVvvHGNYn8T9yNFrYLhZQzABIUy8FW4kNFllQhFHKA';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function checkDatabase() {
  console.log('🔍 Checking database tables...\n');

  try {
    // Check profiles table
    console.log('1. Checking profiles table:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles.length} profiles:`);
      profiles.forEach(p => console.log(`   - ${p.full_name} (${p.role})`));
    }

    // Check worker_profiles table
    console.log('\n2. Checking worker_profiles table:');
    const { data: workers, error: workersError } = await supabase
      .from('worker_profiles')
      .select('id, user_id, business_name, status')
      .limit(5);
    
    if (workersError) {
      console.log('❌ Worker profiles error:', workersError.message);
    } else {
      console.log(`✅ Found ${workers.length} worker profiles:`);
      workers.forEach(w => console.log(`   - ${w.business_name || 'No business name'} (${w.status})`));
    }

    // Check worker_listings view
    console.log('\n3. Checking worker_listings view:');
    const { data: listings, error: listingsError } = await supabase
      .from('worker_listings')
      .select('worker_id, full_name, worker_rating, status')
      .limit(5);
    
    if (listingsError) {
      console.log('❌ Worker listings error:', listingsError.message);
    } else {
      console.log(`✅ Found ${listings.length} worker listings:`);
      listings.forEach(l => console.log(`   - ${l.full_name} (Rating: ${l.worker_rating}, Status: ${l.status})`));
    }

    // Check services table
    console.log('\n4. Checking services table:');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, key, title, is_active')
      .limit(5);
    
    if (servicesError) {
      console.log('❌ Services error:', servicesError.message);
    } else {
      console.log(`✅ Found ${services.length} services:`);
      services.forEach(s => console.log(`   - ${s.title} (${s.key}) - Active: ${s.is_active}`));
    }

    // Check worker_services junction table
    console.log('\n5. Checking worker_services table:');
    const { data: workerServices, error: wsError } = await supabase
      .from('worker_services')
      .select('worker_id, service_id, is_active')
      .limit(5);
    
    if (wsError) {
      console.log('❌ Worker services error:', wsError.message);
    } else {
      console.log(`✅ Found ${workerServices.length} worker-service relationships:`);
      workerServices.forEach(ws => console.log(`   - Worker: ${ws.worker_id}, Service: ${ws.service_id}, Active: ${ws.is_active}`));
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkDatabase();