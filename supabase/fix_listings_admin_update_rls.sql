-- Add RLS policy to allow admins to update listings (for approval/rejection)
-- This allows admins to approve, reject, suspend, or modify any listing

-- Ensure admins can SELECT all listings (for viewing before/after update)
-- This policy should already exist, but we'll verify it
DROP POLICY IF EXISTS "Admins can view all listings" ON public.listings;
CREATE POLICY "Admins can view all listings"
  ON public.listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Drop existing update policy if it exists (we'll recreate it)
DROP POLICY IF EXISTS "Farmers can update own listings" ON public.listings;

-- Recreate farmers update policy
CREATE POLICY "Farmers can update own listings"
  ON public.listings FOR UPDATE
  USING (farmer_id::text = auth.uid()::text)
  WITH CHECK (farmer_id::text = auth.uid()::text);

-- Add admin update policy
DROP POLICY IF EXISTS "Admins can update all listings" ON public.listings;
CREATE POLICY "Admins can update all listings"
  ON public.listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

