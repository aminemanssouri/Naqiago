const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function testServiceLoading() {
  console.log('🔍 Testing service loading by key...\n');

  try {
    // 1. Get all services to see what keys exist
    console.log('1. Available services:');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, key, title, is_active');

    if (servicesError) {
      console.log('❌ Services error:', servicesError.message);
    } else {
      console.log(`✅ Found ${services.length} services:`);
      services.forEach(service => {
        console.log(`   Key: "${service.key}" → ${service.title} (ID: ${service.id}) [Active: ${service.is_active}]`);
      });
    }

    // 2. Test getServiceByKey for each service
    console.log('\n2. Testing getServiceByKey for each service:');
    if (services) {
      for (const service of services) {
        const { data: singleService, error: singleError } = await supabase
          .from('services')
          .select('*')
          .eq('key', service.key)
          .eq('is_active', true)
          .single();

        if (singleError) {
          console.log(`❌ Error loading "${service.key}":`, singleError.message);
        } else {
          console.log(`✅ Successfully loaded "${service.key}": ${singleService.title} (ID: ${singleService.id})`);
        }
      }
    }

    // 3. Test common service keys that might be used
    console.log('\n3. Testing common service keys:');
    const commonKeys = ['basic-wash', 'deluxe-wash', 'deep-clean', 'interior-detail', 'pro-package'];
    
    for (const key of commonKeys) {
      const { data: testService, error: testError } = await supabase
        .from('services')
        .select('*')
        .eq('key', key)
        .eq('is_active', true)
        .single();

      if (testError) {
        console.log(`❌ Key "${key}" not found:`, testError.message);
      } else {
        console.log(`✅ Key "${key}" found: ${testService.title} (ID: ${testService.id})`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testServiceLoading();