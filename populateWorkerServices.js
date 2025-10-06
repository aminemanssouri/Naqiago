const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function populateWorkerServices() {
  console.log('🔧 Populating worker services for complete booking flow...\n');

  try {
    // Get our workers from worker_listings view (bypasses RLS)
    const { data: workers, error: workersError } = await supabase
      .from('worker_listings')
      .select('worker_id, business_name, user_id');

    if (workersError) {
      console.log('❌ Workers error:', workersError.message);
      return;
    }

    console.log(`Found ${workers.length} workers:`);
    workers.forEach(worker => {
      console.log(`   - ${worker.business_name} (ID: ${worker.worker_id})`);
    });

    // Get available services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, title, base_price');

    if (servicesError) {
      console.log('❌ Services error:', servicesError.message);
      return;
    }

    console.log(`\nFound ${services.length} services:`);
    services.forEach(service => {
      console.log(`   - ${service.title} ($${service.base_price})`);
    });

    // Clear existing worker_services first
    console.log('\n🧹 Clearing existing worker_services...');
    await supabase.from('worker_services').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Add services for each worker
    const workerServicesData = [];
    
    for (const worker of workers) {
      for (const service of services) {
        // Give each worker different pricing
        let customPrice = service.base_price;
        
        if (worker.business_name?.includes('Ahmed')) {
          customPrice = service.base_price * 0.9; // Ahmed offers 10% discount
        } else if (worker.business_name?.includes('luxury')) {
          customPrice = service.base_price * 1.1; // Luxury charges 10% premium
        }

        workerServicesData.push({
          worker_id: worker.worker_id,
          service_id: service.id,
          custom_price: customPrice,
          is_active: true
        });
      }
    }

    console.log(`\n📝 Creating ${workerServicesData.length} worker-service relationships...`);
    const { data: created, error: createError } = await supabase
      .from('worker_services')
      .insert(workerServicesData)
      .select();

    if (createError) {
      console.log('❌ Create error:', createError.message);
    } else {
      console.log(`✅ Created ${created.length} worker-service relationships!`);
      
      // Verify the relationships
      console.log('\n🔍 Verifying worker services:');
      const { data: verification, error: verifyError } = await supabase
        .from('worker_services')
        .select(`
          custom_price,
          services(title),
          worker_profiles(business_name)
        `);

      if (verifyError) {
        console.log('❌ Verification error:', verifyError.message);
      } else {
        verification.forEach(ws => {
          console.log(`   ✅ ${ws.worker_profiles?.business_name} → ${ws.services?.title} ($${ws.custom_price})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Population failed:', error.message);
  }
}

populateWorkerServices();