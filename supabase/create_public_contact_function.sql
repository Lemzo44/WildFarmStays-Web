-- Create a database function to handle public contact messages
-- This function bypasses RLS for anonymous inserts, making it more reliable

-- First, ensure we have the necessary policies
DROP POLICY IF EXISTS "Allow ticket creation" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;

-- Create a function that allows anonymous inserts
CREATE OR REPLACE FUNCTION public.create_public_contact_ticket(
  p_name VARCHAR(200),
  p_email VARCHAR(255),
  p_subject VARCHAR(200),
  p_message TEXT,
  p_phone VARCHAR(50) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  ticket_id UUID;
BEGIN
  INSERT INTO public.support_tickets (
    user_id,
    name,
    email,
    subject,
    message,
    status
  ) VALUES (
    NULL, -- user_id is NULL for public contacts
    p_name,
    p_email,
    p_subject,
    CASE 
      WHEN p_phone IS NOT NULL THEN p_message || E'\n\nPhone: ' || p_phone
      ELSE p_message
    END,
    'open'
  )
  RETURNING id INTO ticket_id;
  
  RETURN ticket_id;
END;
$$;

-- Grant execute permission to anonymous users (anon role)
GRANT EXECUTE ON FUNCTION public.create_public_contact_ticket TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_contact_ticket TO authenticated;

-- Also create a simpler RLS policy as backup
CREATE POLICY "Allow ticket creation"
  ON public.support_tickets FOR INSERT
  WITH CHECK (
    -- Authenticated users can create tickets
    (auth.uid() IS NOT NULL)
    OR
    -- Anonymous users can create tickets with NULL user_id
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- Ensure admins can view all tickets
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Ensure users can view their own tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT
  USING (
    (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Ensure users can update their own tickets
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
CREATE POLICY "Users can update own tickets"
  ON public.support_tickets FOR UPDATE
  USING (
    (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Ensure admins can update all tickets
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.support_tickets;
CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets FOR UPDATE
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



