// Quick test script to verify Supabase connection
// Run this with: npx tsx testConnection.ts

// Direct imports to avoid module resolution issues
import { checkSupabaseConnection } from './src/services/utils';
import { servicesService } from './src/services/services';

async function main() {
  console.log('🚀 Starting Supabase connection test...\n');
  
  try {
    // Test 1: Basic connection
    console.log('🔌 Testing basic connection...');
    const connectionResult = await checkSupabaseConnection();
    
    if (connectionResult.status === 'connected') {
      console.log(`✅ Basic connection: OK (${connectionResult.latency}ms)\n`);
    } else {
      throw new Error(connectionResult.error || 'Connection failed');
    }

    // Test 2: Services query
    console.log('🛠️  Testing services query...');
    const services = await servicesService.getServices(false);
    console.log(`✅ Services query: OK (${services.length} services found)\n`);

    console.log('🎉 SUCCESS: Supabase services are connected and working!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ ERROR: Failed to test connection:', error.message);
    process.exit(1);
  }
}

main();