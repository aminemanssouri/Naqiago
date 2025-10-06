const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with service role key (not available in current setup)
// For now, we'll use the anon key but with better connection handling
const supabaseUrl = 'https://zyxrtoepfevcdlmjxstq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5eHJ0b2VwZmV2Y2RsbWp4c3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0OTc3NjksImV4cCI6MjA0OTA3Mzc2OX0.NWVvvHGNYn8T9yNFrYLhZQzABIUy8FW4kNFllQhFHKA';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  global: {
    fetch: (...args) => fetch(...args)
  }
});

async function testConnection() {
  console.log('🔄 Testing Supabase connection...\n');

  try {
    // Try to select from a simple table that should exist
    const { data, error } = await supabase
      .from('services')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('Error details:', error);
      
      // Check if it's a table access issue
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\n💡 It seems the services table doesn\'t exist or isn\'t accessible.');
        console.log('This could mean:');
        console.log('1. The database schema hasn\'t been created yet');
        console.log('2. RLS (Row Level Security) policies are blocking access');
        console.log('3. The anon key doesn\'t have the right permissions');
      }
      
      return false;
    } else {
      console.log('✅ Connection successful!');
      console.log(`Found ${data?.length || 0} services in database`);
      return true;
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function checkRLS() {
  console.log('\n🔒 Checking RLS policies...\n');
  
  try {
    // Try to access different tables to see which ones work
    const tables = ['profiles', 'services', 'worker_profiles', 'bookings'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Accessible`);
        }
      } catch (e) {
        console.log(`❌ ${table}: ${e.message}`);
      }
    }
  } catch (error) {
    console.error('RLS check failed:', error);
  }
}

async function main() {
  const connected = await testConnection();
  
  if (!connected) {
    await checkRLS();
    console.log('\n🔧 Recommendations:');
    console.log('1. Check if the database schema has been deployed');
    console.log('2. Verify RLS policies allow anon access where needed');
    console.log('3. Make sure the services table exists and is accessible');
    console.log('4. Consider using a service role key for admin operations');
  }
}

main().catch(console.error);