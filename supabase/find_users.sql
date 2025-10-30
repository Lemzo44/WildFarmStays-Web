-- Find where authentication users are stored
-- Run this in Supabase SQL Editor

-- 1. Check auth.users table (if you have admin access)
-- Note: You might not be able to query this directly, use the Dashboard instead
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. To see users in Supabase Dashboard:
-- Go to: Authentication → Users
-- 
-- If email confirmation is enabled:
-- - Unconfirmed users will show with "Confirmation pending"
-- - You may need to manually confirm them or they need to click the email link
--
-- If email confirmation is disabled:
-- - Users should appear immediately after signup

-- 3. Check if there are profiles without corresponding auth users
-- (This shouldn't happen if foreign keys are working)
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  p.created_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = p.id
    ) THEN '✅ Has auth user'
    ELSE '❌ Missing auth user'
  END as auth_status
FROM public.profiles p
ORDER BY p.created_at DESC;


