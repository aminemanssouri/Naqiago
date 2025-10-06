const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = 'https://zyxrtoepfevcdlmjxstq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5eHJ0b2VwZmV2Y2RsbWp4c3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0OTc3NjksImV4cCI6MjA0OTA3Mzc2OX0.NWVvvHGNYn8T9yNFrYLhZQzABIUy8FW4kNFllQhFHKA';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

// Generate random locations around Marrakech city center
const generateRandomLocation = (centerLat, centerLng, radiusKm) => {
  const radiusInDegrees = radiusKm / 111; // Approximate conversion
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  return {
    latitude: centerLat + x,
    longitude: centerLng + y,
  };
};

// Marrakech city center coordinates
const MARRAKECH_CENTER = { lat: 31.6295, lng: -7.9811 };

// Sample worker data
const sampleWorkers = [
  {
    full_name: 'Ahmed Benali',
    email: 'ahmed.benali@naqiago.com',
    phone: '+212612345678',
    business_name: 'Pro Car Care Ahmed',
    bio: 'Professional car washing service with attention to detail. I use eco-friendly products and ensure your car looks spotless.',
    experience_years: 3,
    specialties: ['basic-wash', 'premium-wash'],
    location: generateRandomLocation(MARRAKECH_CENTER.lat, MARRAKECH_CENTER.lng, 5),
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    full_name: 'Omar Hassan',
    email: 'omar.hassan@naqiago.com',
    phone: '+212612345679',
    business_name: 'Deluxe Car Wash Omar',
    bio: 'Specialized in premium car care services. I take pride in delivering exceptional results for every vehicle.',
    experience_years: 5,
    specialties: ['deluxe-wash', 'premium-wash'],
    location: generateRandomLocation(MARRAKECH_CENTER.lat, MARRAKECH_CENTER.lng, 5),
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    full_name: 'Youssef Alami',
    email: 'youssef.alami@naqiago.com',
    phone: '+212612345680',
    business_name: 'Eco Wash Youssef',
    bio: 'Environmentally conscious car washing using biodegradable products and water-saving techniques.',
    experience_years: 2,
    specialties: ['eco-wash', 'basic-wash'],
    location: generateRandomLocation(MARRAKECH_CENTER.lat, MARRAKECH_CENTER.lng, 5),
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  },
  {
    full_name: 'Hassan Benjelloun',
    email: 'hassan.benjelloun@naqiago.com',
    phone: '+212612345681',
    business_name: 'Premium Auto Care Hassan',
    bio: 'Expert in luxury vehicle care with years of experience in premium automotive detailing.',
    experience_years: 7,
    specialties: ['premium-wash', 'deluxe-wash'],
    location: generateRandomLocation(MARRAKECH_CENTER.lat, MARRAKECH_CENTER.lng, 5),
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face'
  }
];

async function populateWorkerData() {
  try {
    console.log('🚀 Starting worker data population...');
    
    // First, get all services to create service mappings
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, key, title');
    
    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return;
    }
    
    console.log(`Found ${services.length} services in database`);
    
    for (const workerData of sampleWorkers) {
      try {
        console.log(`\n📝 Creating worker: ${workerData.full_name}...`);
        
        // Create user profile first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            full_name: workerData.full_name,
            email: workerData.email,
            phone: workerData.phone,
            avatar_url: workerData.avatar_url,
            role: 'worker'
          })
          .select('id')
          .single();
        
        if (profileError) {
          console.error(`Error creating profile for ${workerData.full_name}:`, profileError);
          continue;
        }
        
        console.log(`✅ Profile created for ${workerData.full_name}`);
        
        // Create worker profile
        const { data: workerProfile, error: workerError } = await supabase
          .from('worker_profiles')
          .insert({
            user_id: profile.id,
            business_name: workerData.business_name,
            bio: workerData.bio,
            experience_years: workerData.experience_years,
            specialties: workerData.specialties,
            base_location: `POINT(${workerData.location.longitude} ${workerData.location.latitude})`,
            status: 'available',
            service_radius_km: 15,
            hourly_rate: 80 + Math.floor(Math.random() * 40), // Random rate between 80-120
            total_jobs_completed: Math.floor(Math.random() * 200),
            total_earnings: Math.floor(Math.random() * 50000),
            works_weekends: true,
            start_time: '08:00:00',
            end_time: '18:00:00'
          })
          .select('id')
          .single();
        
        if (workerError) {
          console.error(`Error creating worker profile for ${workerData.full_name}:`, workerError);
          continue;
        }
        
        console.log(`✅ Worker profile created for ${workerData.full_name}`);
        
        // Create worker-service relationships
        for (const serviceKey of workerData.specialties) {
          const service = services.find(s => s.key === serviceKey);
          if (service) {
            const { error: serviceError } = await supabase
              .from('worker_services')
              .insert({
                worker_id: workerProfile.id,
                service_id: service.id,
                custom_price: null, // Use default service pricing
                is_active: true
              });
            
            if (serviceError) {
              console.error(`Error linking service ${serviceKey} to ${workerData.full_name}:`, serviceError);
            } else {
              console.log(`✅ Linked ${service.title} to ${workerData.full_name}`);
            }
          }
        }
        
      } catch (err) {
        console.error(`Failed to create worker ${workerData.full_name}:`, err);
      }
    }
    
    console.log('\n🎉 Worker data population completed!');
    
    // Verify the data
    const { data: workerListings, error: verifyError } = await supabase
      .from('worker_listings')
      .select('*');
    
    if (verifyError) {
      console.error('Verification error:', verifyError);
      return;
    }
    
    console.log(`\n✅ Verification: ${workerListings.length} workers found in worker_listings view`);
    workerListings.forEach(worker => {
      console.log(`- ${worker.full_name} (${worker.business_name}) - Status: ${worker.status}`);
    });
    
  } catch (error) {
    console.error('Population failed:', error);
  }
}

populateWorkerData();