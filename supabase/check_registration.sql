-- Check registration data across both tables
-- Run this in Supabase SQL Editor to see all registration data

-- 1. Check all auth users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- 2. Check all profiles
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  phone,
  farm_name,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

-- 3. Join both to see complete registration data (matched by ID)
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.first_name,
  p.last_name,
  p.role,
  p.phone,
  p.farm_name,
  u.created_at as auth_created_at,
  p.created_at as profile_created_at,
  CASE 
    WHEN p.id IS NULL THEN '❌ Missing Profile'
    WHEN u.email_confirmed_at IS NULL THEN '⚠️ Email Not Confirmed'
    ELSE '✅ Complete'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;


