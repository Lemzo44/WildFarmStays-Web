-- Create or Update Admin User in Supabase
-- Run this in Supabase SQL Editor

-- ==========================================
-- OPTION 1: Update an existing user to admin
-- ==========================================
-- First, register the user normally through the app, then run this:

-- Replace 'your-email@example.com' with the email you registered with
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';

-- Verify it worked:
SELECT id, email, first_name, last_name, role 
FROM public.profiles 
WHERE email = 'your-email@example.com';

-- ==========================================
-- OPTION 2: Create admin user directly (if you have admin access)
-- ==========================================
-- Note: This is more complex as we need to hash the password
-- The easiest way is to register through the app first, then update role

-- If you need to create via SQL, you can use Supabase's auth.admin functions,
-- but this requires service role key access. Instead, we'll:
-- 1. Register via app with email/password
-- 2. Update role to admin (see Option 1 above)

-- ==========================================
-- OPTION 3: Create admin using Supabase Dashboard
-- ==========================================
-- 1. Go to Authentication → Users → Add User
-- 2. Enter email and password
-- 3. After user is created, run Option 1 SQL to set role to 'admin'

-- ==========================================
-- VERIFY ADMIN USERS
-- ==========================================
-- Check all admin users:
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  u.email_confirmed_at,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;

