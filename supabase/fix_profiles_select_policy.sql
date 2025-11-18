-- Allow authenticated users to read profiles (for names in messaging, ratings, etc.)
-- If you prefer stricter exposure, create a view with limited columns instead.

-- Enable RLS if not already
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing read policy if present
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;

-- Authenticated users can read all profiles (for basic display fields)
CREATE POLICY "Authenticated can read profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);




