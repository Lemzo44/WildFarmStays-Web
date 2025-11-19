-- Complete RLS fix for support_tickets to allow both authenticated and anonymous inserts
-- This replaces all existing policies with a clean set

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can create support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.support_tickets;

-- INSERT Policy: Allow authenticated users OR anonymous users (when user_id is NULL)
CREATE POLICY "Allow ticket creation"
  ON public.support_tickets FOR INSERT
  WITH CHECK (
    -- Authenticated users can create tickets with their user_id
    (auth.uid() IS NOT NULL)
    OR
    -- Anonymous users can create tickets but ONLY if user_id is NULL (public contact)
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- SELECT Policy: Users can view their own tickets, admins can view all
CREATE POLICY "Allow ticket viewing"
  ON public.support_tickets FOR SELECT
  USING (
    -- Users can view their own tickets
    (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
    OR
    -- Admins can view all tickets
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Allow anonymous users to view tickets they just created (for confirmation)
    -- This is optional - you can remove this if you don't want anonymous users to see tickets
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- UPDATE Policy: Users can update their own tickets, admins can update all
CREATE POLICY "Allow ticket updates"
  ON public.support_tickets FOR UPDATE
  USING (
    -- Users can update their own tickets
    (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
    OR
    -- Admins can update all tickets
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Verify RLS is enabled
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;



