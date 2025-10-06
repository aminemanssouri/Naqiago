/**
 * Test Payment Creation
 * 
 * This script tests the payment creation functionality
 * Run with: node testPaymentCreation.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use your Supabase credentials
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPaymentCreation() {
  console.log('🧪 Testing Payment Creation\n');

  try {
    // 1. Get a test booking (most recent one)
    console.log('1️⃣ Fetching a test booking...');
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, customer_id, worker_id, total_price, booking_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (bookingError) throw bookingError;
    
    if (!bookings || bookings.length === 0) {
      console.log('❌ No bookings found in database. Please create a booking first.');
      return;
    }

    const booking = bookings[0];
    console.log('✅ Found booking:', {
      id: booking.id,
      booking_number: booking.booking_number,
      total_price: booking.total_price
    });

    // 2. Check if payment already exists for this booking
    console.log('\n2️⃣ Checking if payment already exists...');
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', booking.id)
      .single();

    if (existingPayment) {
      console.log('⚠️ Payment already exists for this booking:', {
        id: existingPayment.id,
        amount: existingPayment.amount,
        status: existingPayment.status,
        payment_method: existingPayment.payment_method,
        platform_fee: existingPayment.platform_fee,
        worker_earnings: existingPayment.worker_earnings
      });
      return;
    }

    // 3. Create a test payment
    console.log('\n3️⃣ Creating payment record...');
    const platformFeePercentage = 15; // 15%
    const amount = parseFloat(booking.total_price);
    const platformFee = (amount * platformFeePercentage) / 100;
    const workerEarnings = amount - platformFee;

    const paymentData = {
      booking_id: booking.id,
      customer_id: booking.customer_id,
      worker_id: booking.worker_id,
      amount: amount,
      currency: 'MAD',
      payment_method: 'cash',
      status: 'pending',
      platform_fee: platformFee,
      worker_earnings: workerEarnings,
      gateway_transaction_id: null,
      gateway_reference: null,
      gateway_response: null,
      processed_at: null
    };

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) throw paymentError;

    console.log('✅ Payment created successfully!');
    console.log({
      id: payment.id,
      booking_id: payment.booking_id,
      amount: payment.amount,
      currency: payment.currency,
      payment_method: payment.payment_method,
      status: payment.status,
      platform_fee: payment.platform_fee,
      worker_earnings: payment.worker_earnings,
      created_at: payment.created_at
    });

    // 4. Verify payment was created
    console.log('\n4️⃣ Verifying payment in database...');
    const { data: verifyPayment, error: verifyError } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', booking.id)
      .single();

    if (verifyError) throw verifyError;

    console.log('✅ Payment verified in database:', {
      id: verifyPayment.id,
      status: verifyPayment.status
    });

    // 5. Test payment status update
    console.log('\n5️⃣ Testing payment status update to "completed"...');
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        gateway_reference: `CASH-${Date.now()}`,
        gateway_response: { 
          method: 'cash', 
          completed_at: new Date().toISOString() 
        }
      })
      .eq('id', payment.id)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log('✅ Payment status updated successfully:', {
      id: updatedPayment.id,
      status: updatedPayment.status,
      processed_at: updatedPayment.processed_at
    });

    console.log('\n✅ All payment tests passed successfully! 🎉');

  } catch (error) {
    console.error('\n❌ Error during payment test:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testPaymentCreation()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
