-- Create Test Farmers Script
-- Run this BEFORE running seed_test_listings.sql if you don't have any farmer users yet
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
--
-- This creates 2 test farmer profiles that can be used for listing creation
-- Note: You'll still need to create auth.users entries via the app registration flow
-- OR create them manually in Supabase Auth dashboard first
--
-- Option 1: If you have existing auth users, update their profiles to be farmers
-- Option 2: Register farmers through the app first, then run seed_test_listings.sql

-- Check if any farmers exist
SELECT 
    COUNT(*) as farmer_count,
    array_agg(id) as farmer_ids
FROM public.profiles 
WHERE role = 'farmer';

-- If you need to manually create a farmer profile (after creating auth user):
-- Replace 'YOUR_AUTH_USER_ID_HERE' with an actual UUID from auth.users
/*
INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    farm_name,
    farm_address,
    postcode,
    county,
    verified,
    join_date
) VALUES (
    'YOUR_AUTH_USER_ID_HERE', -- Get from auth.users table
    'farmer1@test.com',
    'John',
    'Farmer',
    '+353 87 123 4567',
    'farmer',
    'Test Farm',
    '123 Farm Road',
    'T12 AB34',
    'Cork',
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE SET role = 'farmer';
*/

-- OR: Update an existing user to be a farmer
-- Replace 'USER_ID_HERE' with an existing user's ID
/*
UPDATE public.profiles
SET 
    role = 'farmer',
    farm_name = 'Test Farm',
    farm_address = '123 Farm Road',
    postcode = 'T12 AB34',
    county = 'Cork'
WHERE id = 'USER_ID_HERE';
*/

