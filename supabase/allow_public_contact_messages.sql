-- Allow anonymous (public) users to create support tickets for contact form
-- These will have user_id = NULL to distinguish them from logged-in user tickets

-- Update RLS policy to allow anonymous inserts
DROP POLICY IF EXISTS "Users can create support tickets" ON public.support_tickets;
CREATE POLICY "Users can create support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (
    -- Allow authenticated users (campers/farmers)
    auth.uid() IS NOT NULL
    OR
    -- Allow anonymous users (public contact form) - but only if user_id is NULL
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Ensure admins can still view all tickets (including public contact messages)
-- This policy already exists but keeping it for clarity
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

