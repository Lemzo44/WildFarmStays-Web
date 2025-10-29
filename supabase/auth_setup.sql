-- Additional RLS policies needed for authentication
-- Run this after your main schema.sql

-- Allow users to insert their own profile during registration
-- This is needed because the profile insert happens right after auth.signUp
CREATE POLICY "Users can insert own profile during registration"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Note: The existing policies from schema.sql should already cover:
-- - Users can view own profile (SELECT)
-- - Users can update own profile (UPDATE)

-- If the policy already exists, you can skip this or drop and recreate:
-- DROP POLICY IF EXISTS "Users can insert own profile during registration" ON public.profiles;

