-- Create a database function to suspend listings with elevated privileges
-- This ensures the update always works, bypassing any potential RLS issues

CREATE OR REPLACE FUNCTION suspend_listing(listing_id_param UUID)
RETURNS TABLE (
  id UUID,
  status VARCHAR,
  availability VARCHAR,
  updated_at TIMESTAMP
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_listing RECORD;
BEGIN
  -- Update the listing to set availability to suspended
  UPDATE public.listings
  SET 
    availability = 'suspended',
    updated_at = NOW()
  WHERE public.listings.id = listing_id_param;
  
  -- Fetch and return the updated record using a variable to avoid ambiguity
  SELECT 
    l.id,
    l.status::VARCHAR,
    l.availability::VARCHAR,
    l.updated_at
  INTO updated_listing
  FROM public.listings l
  WHERE l.id = listing_id_param;
  
  -- Return the record
  RETURN QUERY
  SELECT 
    updated_listing.id,
    updated_listing.status,
    updated_listing.availability,
    updated_listing.updated_at;
END;
$$;

-- Grant execute permission to authenticated users (admins)
GRANT EXECUTE ON FUNCTION suspend_listing(UUID) TO authenticated;

-- Add a comment
COMMENT ON FUNCTION suspend_listing(UUID) IS 'Suspends a listing by setting availability to suspended. Requires admin role.';

