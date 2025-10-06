// Simple connection test without React Native dependencies
console.log('🚀 Checking Supabase configuration...\n');

// Check if environment variables are set
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Environment variables not loaded. Checking .env file...');
  
  try {
    // Try to load from .env file
    const fs = require('fs');
    const path = require('path');
    
    const envFile = path.join(__dirname, '.env');
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      
      const urlMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/);
      const keyMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
      
      if (urlMatch && keyMatch) {
        console.log('✅ Found Supabase configuration in .env file');
        console.log(`📍 Supabase URL: ${urlMatch[1].substring(0, 30)}...`);
        console.log(`🔑 Supabase Key: ${keyMatch[1].substring(0, 30)}...`);
        
        // Try a simple HTTP request to test the connection
        const https = require('https');
        const url = new URL(`${urlMatch[1]}/rest/v1/`);
        
        console.log('\n🔌 Testing HTTP connection to Supabase...');
        
        const options = {
          hostname: url.hostname,
          port: 443,
          path: url.pathname,
          method: 'GET',
          headers: {
            'apikey': keyMatch[1].trim(),
            'Authorization': `Bearer ${keyMatch[1].trim()}`
          }
        };
        
        const req = https.request(options, (res) => {
          console.log(`✅ HTTP Status: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            console.log('🎉 SUCCESS: Supabase is accessible and configured correctly!');
            console.log('\n📋 Summary:');
            console.log('  ✅ Environment variables found');
            console.log('  ✅ Supabase endpoint accessible');
            console.log('  ✅ API key valid');
            console.log('\nYou can now use your enhanced services in your React Native app!');
          } else if (res.statusCode === 401) {
            console.log('❌ Authentication failed - check your API key');
          } else {
            console.log(`⚠️  Unexpected status code: ${res.statusCode}`);
          }
        });
        
        req.on('error', (error) => {
          console.log('❌ Connection failed:', error.message);
        });
        
        req.setTimeout(5000, () => {
          console.log('❌ Request timeout - check your internet connection');
          req.destroy();
        });
        
        req.end();
      } else {
        console.log('❌ Supabase configuration not found in .env file');
      }
    } else {
      console.log('❌ .env file not found');
    }
  } catch (error) {
    console.log('❌ Error reading .env file:', error.message);
  }
} else {
  console.log('✅ Environment variables are loaded');
  console.log(`📍 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`🔑 Supabase Key: ${supabaseKey.substring(0, 30)}...`);
}