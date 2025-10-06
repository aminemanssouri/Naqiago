const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function testQuery() {
  console.log('Testing query to get ALL workers regardless of status...\n');
  
  const { data, error } = await supabase
    .from('worker_listings')
    .select('*'); // No status filter - get all workers
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('🎉 Query successful!');
    console.log(`✅ Found ${data.length} workers:`);
    data.forEach((worker, i) => {
      console.log(`   ${i + 1}. ${worker.full_name} (Status: ${worker.status})`);
    });
  }
}

testQuery();