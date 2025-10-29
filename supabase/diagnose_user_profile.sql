-- Diagnose User Profile Issues
-- Run this to check if a user's profile is set up correctly for booking creation

-- Replace 'USER_EMAIL_HERE' with the camper's email, or use auth.uid() if running as the user
-- Option 1: Check by email
SELECT 
    u.id as auth_user_id,
    u.email as auth_email,
    u.email_confirmed_at,
    p.id as profile_id,
    p.email as profile_email,
    p.role as profile_role,
    p.first_name,
    p.last_name,
    CASE 
        WHEN p.id IS NULL THEN '❌ NO PROFILE - User needs to register via app'
        WHEN p.role != 'camper' THEN '❌ WRONG ROLE - Role is: ' || p.role
        WHEN u.id IS NULL THEN '❌ USER NOT FOUND'
        ELSE '✅ PROFILE OK'
    END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'USER_EMAIL_HERE'  -- Replace with actual email
ORDER BY u.created_at DESC;

-- Option 2: Check current authenticated user (run while logged in as the camper)
-- You can run this in Supabase SQL Editor if you're authenticated, or get the user ID first
/*
SELECT 
    auth.uid() as current_user_id,
    p.id as profile_id,
    p.email,
    p.role,
    p.first_name || ' ' || p.last_name as name,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ NOT AUTHENTICATED'
        WHEN p.id IS NULL THEN '❌ NO PROFILE EXISTS'
        WHEN p.role != 'camper' THEN '❌ ROLE IS: ' || p.role || ' (needs to be camper)'
        ELSE '✅ OK - User can create bookings'
    END as booking_status
FROM public.profiles p
WHERE p.id = auth.uid();
*/

-- Option 3: Fix a user's role if it's wrong
-- Only run this if you need to fix a specific user's role:
/*
UPDATE public.profiles
SET role = 'camper'
WHERE email = 'USER_EMAIL_HERE'  -- Replace with actual email
  AND role != 'camper';
*/

