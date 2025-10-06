// Script to enhance the services table with notes and inclusions columns
// Run this with: node enhanceServicesTable.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function enhanceServicesTable() {
  console.log('🚀 Enhancing services table with notes and inclusions...\n');

  try {
    // Add notes and inclusions columns
    console.log('📝 Adding notes and inclusions columns...');
    
    // Note: These are PostgreSQL raw queries, may need to be run in Supabase SQL editor
    const alterQueries = [
      'ALTER TABLE public.services ADD COLUMN IF NOT EXISTS notes text;',
      'ALTER TABLE public.services ADD COLUMN IF NOT EXISTS inclusions jsonb DEFAULT \'[]\';',
      'ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url character varying;'
    ];

    console.log('⚠️  Please run these SQL commands in your Supabase SQL editor:');
    console.log('----------------------------------------');
    alterQueries.forEach(query => console.log(query));
    console.log('----------------------------------------\n');

    // Check current services and update them with sample data
    const { data: services, error } = await supabase
      .from('services')
      .select('*');

    if (error) throw error;

    console.log(`📋 Found ${services.length} services. Updating with sample inclusions and notes...`);

    // Update each service with sample inclusions and notes
    for (const service of services) {
      let inclusions = [];
      let notes = '';

      // Generate inclusions based on service key
      switch (service.key) {
        case 'basic-wash':
          inclusions = [
            { title: 'Exterior Hand Wash', description: 'Complete hand washing of all exterior surfaces', icon: 'droplets' },
            { title: 'Wheel Cleaning', description: 'Thorough cleaning of wheels and rims', icon: 'car-wheel' },
            { title: 'Window Cleaning', description: 'All windows cleaned inside and out', icon: 'window' },
            { title: 'Basic Drying', description: 'Vehicle hand dried with microfiber towels', icon: 'towel' }
          ];
          notes = 'Basic service suitable for regular maintenance. Duration may vary based on vehicle size and condition.';
          break;

        case 'deluxe-wash':
          inclusions = [
            { title: 'Everything in Basic Wash', description: 'All features of our basic wash service', icon: 'check-all' },
            { title: 'Interior Vacuuming', description: 'Complete interior vacuuming including seats and trunk', icon: 'vacuum-cleaner' },
            { title: 'Dashboard Cleaning', description: 'Detailed cleaning of dashboard and console', icon: 'dashboard' },
            { title: 'Door Jamb Cleaning', description: 'Cleaning of door frames and interior edges', icon: 'door' }
          ];
          notes = 'Popular choice for monthly deep cleaning. Includes both interior and exterior services.';
          break;

        case 'premium-detail':
          inclusions = [
            { title: 'Everything in Deluxe Wash', description: 'All deluxe wash features included', icon: 'check-all' },
            { title: 'Leather Conditioning', description: 'Premium conditioning for all leather surfaces', icon: 'material-leather', highlight: true },
            { title: 'Premium Wax Application', description: 'Hand application of high-quality carnauba wax', icon: 'polish', highlight: true },
            { title: 'Tire Shine', description: 'Professional tire shine and protection', icon: 'tire', highlight: true },
            { title: 'Engine Bay Cleaning', description: 'Detailed engine compartment cleaning', icon: 'engine', highlight: true }
          ];
          notes = 'Our premium service requires 2+ hours. Recommended for special occasions or quarterly maintenance.';
          break;

        case 'interior-detail':
          inclusions = [
            { title: 'Deep Vacuuming', description: 'Thorough vacuuming of all interior surfaces', icon: 'vacuum-cleaner' },
            { title: 'Seat Cleaning', description: 'Professional cleaning of all seats', icon: 'seat' },
            { title: 'Carpet Shampooing', description: 'Deep cleaning of carpets and floor mats', icon: 'carpet' },
            { title: 'Interior Protection', description: 'Application of protective coating', icon: 'shield' }
          ];
          notes = 'Specializes in interior only. Perfect for vehicles with clean exteriors but dirty interiors.';
          break;

        case 'wax-shine':
          inclusions = [
            { title: 'Exterior Wash', description: 'Complete exterior cleaning preparation', icon: 'car-wash' },
            { title: 'Premium Wax', description: 'High-quality carnauba wax application', icon: 'polish', highlight: true },
            { title: 'Paint Protection', description: 'Long-lasting paint protection coating', icon: 'shield', highlight: true },
            { title: 'Chrome Polishing', description: 'Polishing of all chrome surfaces', icon: 'chrome' }
          ];
          notes = 'Focuses on paint protection and shine. Best performed in shaded areas to ensure optimal results.';
          break;

        default:
          inclusions = [
            { title: 'Professional Service', description: 'High-quality car care service', icon: 'star' },
            { title: 'Quality Products', description: 'Premium cleaning products used', icon: 'bottle' }
          ];
          notes = 'Professional car wash service with attention to detail.';
      }

      // Update the service
      const { error: updateError } = await supabase
        .from('services')
        .update({ 
          inclusions,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', service.id);

      if (updateError) {
        console.error(`❌ Error updating service ${service.title}:`, updateError.message);
      } else {
        console.log(`✅ Updated ${service.title} with ${inclusions.length} inclusions`);
      }
    }

    console.log('\n🎉 Services table enhancement complete!');
    console.log('   Your services now have detailed inclusions and notes.');
    
  } catch (error) {
    console.error('❌ Error enhancing services table:', error.message);
    process.exit(1);
  }
}

// Run the enhancement
enhanceServicesTable();