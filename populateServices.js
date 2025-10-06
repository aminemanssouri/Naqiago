// Script to populate your Supabase database with sample services
// Run this with: node populateServices.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample services data
const sampleServices = [
  {
    key: 'basic-wash',
    title: 'Basic Wash',
    description: 'Exterior wash and dry',
    category: 'basic',
    base_price: 60,
    duration_minutes: 30,
    icon_name: 'Droplets',
    is_active: true,
    sedan_multiplier: 1.0,
    suv_multiplier: 1.2,
    van_multiplier: 1.4,
    truck_multiplier: 1.6
  },
  {
    key: 'deluxe-wash',
    title: 'Deluxe Wash',
    description: 'Exterior + interior cleaning',
    category: 'deluxe',
    base_price: 120,
    duration_minutes: 60,
    icon_name: 'Sparkles',
    is_active: true,
    sedan_multiplier: 1.0,
    suv_multiplier: 1.2,
    van_multiplier: 1.4,
    truck_multiplier: 1.6
  },
  {
    key: 'premium-detail',
    title: 'Premium Detail',
    description: 'Full detailing inside and out',
    category: 'premium',
    base_price: 220,
    duration_minutes: 120,
    icon_name: 'Wrench',
    is_active: true,
    sedan_multiplier: 1.0,
    suv_multiplier: 1.3,
    van_multiplier: 1.5,
    truck_multiplier: 1.8
  },
  {
    key: 'interior-detail',
    title: 'Interior Detail',
    description: 'Deep vacuum and interior detailing',
    category: 'specialty',
    base_price: 140,
    duration_minutes: 90,
    icon_name: 'Brush',
    is_active: true,
    sedan_multiplier: 1.0,
    suv_multiplier: 1.2,
    van_multiplier: 1.3,
    truck_multiplier: 1.4
  },
  {
    key: 'wax-shine',
    title: 'Wax & Shine',
    description: 'Professional wax and shine treatment',
    category: 'premium',
    base_price: 180,
    duration_minutes: 75,
    icon_name: 'SprayCan',
    is_active: true,
    sedan_multiplier: 1.0,
    suv_multiplier: 1.2,
    van_multiplier: 1.4,
    truck_multiplier: 1.6
  }
];

async function populateServices() {
  console.log('🚀 Populating Supabase with sample services...\n');

  try {
    // Check if services already exist
    const { data: existingServices, error: checkError } = await supabase
      .from('services')
      .select('key')
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    if (existingServices && existingServices.length > 0) {
      console.log('⚠️  Services already exist in database.');
      console.log('   If you want to repopulate, delete existing services first.');
      
      // Show existing services count
      const { count } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true });
      
      console.log(`   Found ${count} existing services.`);
      
      process.exit(0);
    }

    // Insert sample services
    console.log('📝 Inserting sample services...');
    
    const { data, error } = await supabase
      .from('services')
      .insert(sampleServices)
      .select();

    if (error) {
      throw error;
    }

    console.log('✅ Successfully inserted services:');
    data.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.title} - ${service.base_price} MAD`);
    });

    console.log(`\n🎉 Database populated with ${data.length} services!`);
    console.log('   Your app can now display real data from Supabase.');
    
  } catch (error) {
    console.error('❌ Error populating services:', error.message);
    
    if (error.code === '42501') {
      console.log('\n💡 This might be a permissions issue.');
      console.log('   Make sure your Supabase RLS policies allow inserts.');
    }
    
    process.exit(1);
  }
}

// Run the population
populateServices();