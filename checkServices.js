const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://bwqgjtvmruefphwtoxpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cWdqdHZtcnVlZnBod3RveHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MzEyNjUsImV4cCI6MjA0NjMwNzI2NX0.zAKsq2vJRJWrLaUu02Wx0YfOeW5vvlNQTWEPGONxL5E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkServices() {
  console.log('🔍 Checking services in database...');
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('created_at');
  
  if (error) {
    console.error('❌ Error fetching services:', error);
    return;
  }
  
  console.log('✅ Services found:', data.length);
  console.log('\n📋 Service details:');
  data.forEach(service => {
    console.log(`- ID: ${service.id}`);
    console.log(`  Key: ${service.key}`);
    console.log(`  Title: ${service.title}`);
    console.log(`  Price: ${service.price} MAD`);
    console.log('');
  });

  // Find the basic service
  const basicService = data.find(s => s.key === 'basic');
  if (basicService) {
    console.log('🎯 Basic service found:');
    console.log(`   UUID: ${basicService.id}`);
    console.log(`   Key: ${basicService.key}`);
  } else {
    console.log('❌ Basic service not found!');
  }
}

checkServices().catch(console.error);