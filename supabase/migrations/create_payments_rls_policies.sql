-- ============================================
-- PAYMENTS TABLE RLS POLICIES
-- ============================================
-- Run this in your Supabase SQL Editor
-- This will enable proper access control for the payments table

-- Enable RLS on payments table (if not already enabled)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. CUSTOMERS can view their own payments
-- ============================================
CREATE POLICY "Customers can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = customer_id);

-- ============================================
-- 2. WORKERS can view payments for their jobs
-- ============================================
CREATE POLICY "Workers can view their payments"
ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.worker_profiles
    WHERE worker_profiles.id = payments.worker_id
    AND worker_profiles.user_id = auth.uid()
  )
);

-- ============================================
-- 3. SERVICE ROLE can insert payments (backend)
-- ============================================
CREATE POLICY "Service role can insert payments"
ON public.payments
FOR INSERT
WITH CHECK (true);

-- ============================================
-- 4. AUTHENTICATED USERS can create payments for their bookings
-- ============================================
CREATE POLICY "Users can create payments for their bookings"
ON public.payments
FOR INSERT
WITH CHECK (
  auth.uid() = customer_id
  OR EXISTS (
    SELECT 1 FROM public.worker_profiles
    WHERE worker_profiles.id = payments.worker_id
    AND worker_profiles.user_id = auth.uid()
  )
);

-- ============================================
-- 5. SYSTEM can update payment status
-- ============================================
CREATE POLICY "System can update payment status"
ON public.payments
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================
-- 6. CUSTOMERS can update their payment details (before processing)
-- ============================================
CREATE POLICY "Customers can update pending payments"
ON public.payments
FOR UPDATE
USING (
  auth.uid() = customer_id
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = customer_id
  AND status = 'pending'
);

-- ============================================
-- 7. WORKERS can mark cash payments as completed
-- ============================================
CREATE POLICY "Workers can complete cash payments"
ON public.payments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.worker_profiles
    WHERE worker_profiles.id = payments.worker_id
    AND worker_profiles.user_id = auth.uid()
  )
  AND payment_method = 'cash'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.worker_profiles
    WHERE worker_profiles.id = payments.worker_id
    AND worker_profiles.user_id = auth.uid()
  )
  AND payment_method = 'cash'
);

-- ============================================
-- VERIFY POLICIES
-- ============================================
-- Check that policies were created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'payments'
ORDER BY policyname;
