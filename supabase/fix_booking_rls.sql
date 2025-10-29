-- Fix Booking RLS Policy Issue
-- This script diagnoses and fixes the RLS policy for booking creation

-- STEP 1: Check current user's profile and role
-- Run this while logged in as the camper to see what Supabase sees:
SELECT 
    auth.uid() as current_user_id,
    p.id as profile_id,
    p.role as user_role,
    p.email,
    p.first_name || ' ' || p.last_name as name
FROM public.profiles p
WHERE p.id = auth.uid();

-- STEP 2: Check if the booking policy exists and is correct
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
WHERE tablename = 'bookings' AND policyname LIKE '%create%';

-- STEP 3: Drop and recreate the booking INSERT policy with better error handling
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Campers can create bookings" ON public.bookings;

-- Create a more explicit policy that's easier to debug
CREATE POLICY "Campers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    -- Ensure user is authenticated
    auth.uid() IS NOT NULL
    -- Check user has camper role
    AND EXISTS (
      SELECT 1 
      FROM public.profiles
      WHERE id = auth.uid() 
      AND role = 'camper'
    )
    -- Ensure camper_id matches authenticated user
    AND camper_id = auth.uid()
  );

-- STEP 4: Alternative - Create a more permissive policy for testing (REMOVE THIS IN PRODUCTION)
-- If the above still doesn't work, this temporarily allows any authenticated user to create bookings
-- ONLY USE THIS FOR DEBUGGING, THEN REMOVE IT!
/*
DROP POLICY IF EXISTS "Campers can create bookings" ON public.bookings;

CREATE POLICY "Campers can create bookings (permissive for testing)"
  ON public.bookings FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND camper_id = auth.uid()
  );
*/

-- STEP 5: Verify the policy was created
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'bookings' AND policyname LIKE '%create%';

