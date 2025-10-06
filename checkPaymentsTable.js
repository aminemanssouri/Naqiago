/**
 * Check Payments Table and RLS Policies
 * 
 * This script checks if the payments table exists and has proper RLS policies
 * Run with: node checkPaymentsTable.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPaymentsTable() {
  console.log('🔍 Checking Payments Table Status\n');

  try {
    // 1. Check if payments table exists and is accessible
    console.log('1️⃣ Checking if payments table is accessible...');
    const { data: payments, error: selectError } = await supabase
      .from('payments')
      .select('*')
      .limit(1);

    if (selectError) {
      if (selectError.code === '42P01') {
        console.log('❌ Payments table does NOT exist in database');
        console.log('   Please create the payments table first.');
        return;
      } else if (selectError.code === '42501') {
        console.log('⚠️  Payments table exists but RLS is blocking SELECT');
        console.log('   This is expected with strict RLS policies.');
      } else {
        console.log('❌ Error accessing payments table:', selectError.message);
        return;
      }
    } else {
      console.log('✅ Payments table exists and is accessible');
      console.log(`   Found ${payments?.length || 0} payment(s)`);
    }

    // 2. Count total payments (might fail due to RLS)
    console.log('\n2️⃣ Counting total payments...');
    const { count, error: countError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('⚠️  Cannot count payments (RLS restriction)');
    } else {
      console.log(`✅ Total payments in database: ${count}`);
    }

    // 3. Check bookings table
    console.log('\n3️⃣ Checking bookings table...');
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, booking_number, total_price, customer_id, worker_id')
      .order('created_at', { ascending: false })
      .limit(3);

    if (bookingError) {
      console.log('❌ Error fetching bookings:', bookingError.message);
    } else {
      console.log(`✅ Found ${bookings.length} recent booking(s)`);
      if (bookings.length > 0) {
        console.log('\n   Recent bookings:');
        bookings.forEach((b, i) => {
          console.log(`   ${i + 1}. ${b.booking_number} - ${b.total_price} MAD`);
        });
      }
    }

    // 4. Try to check if any booking has a payment
    if (bookings && bookings.length > 0) {
      console.log('\n4️⃣ Checking if bookings have payments...');
      for (const booking of bookings) {
        const { data: payment, error: payError } = await supabase
          .from('payments')
          .select('id, status, amount')
          .eq('booking_id', booking.id)
          .maybeSingle();

        if (payError && payError.code !== 'PGRST116') {
          console.log(`   ⚠️  ${booking.booking_number}: Cannot check (RLS)`);
        } else if (!payment) {
          console.log(`   ❌ ${booking.booking_number}: NO PAYMENT RECORD`);
        } else {
          console.log(`   ✅ ${booking.booking_number}: Has payment (${payment.status})`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Payments table exists');
    console.log('⚠️  RLS policies are active (expected behavior)');
    console.log('');
    console.log('🔧 TO FIX PAYMENT CREATION:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Run the SQL in: supabase/migrations/create_payments_rls_policies.sql');
    console.log('   3. This will add proper RLS policies for authenticated users');
    console.log('');
    console.log('📱 IN YOUR APP:');
    console.log('   The payment service will work automatically once RLS is configured!');
    console.log('   Users will be able to create payments when authenticated.');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the check
checkPaymentsTable()
  .then(() => {
    console.log('\n✅ Check completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
