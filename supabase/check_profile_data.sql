-- Check if profile data (name, phone) is being stored correctly
-- Run this in Supabase SQL Editor

-- View all profiles with their data
SELECT 
  id,
  email,
  first_name,
  last_name,
  phone,
  role,
  farm_name,
  created_at,
  updated_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- Check if any profiles are missing first_name or last_name
SELECT 
  id,
  email,
  first_name,
  last_name,
  phone,
  CASE 
    WHEN first_name IS NULL OR first_name = '' THEN '❌ Missing first_name'
    WHEN last_name IS NULL OR last_name = '' THEN '❌ Missing last_name'
    ELSE '✅ Complete'
  END as name_status
FROM public.profiles
ORDER BY created_at DESC;

