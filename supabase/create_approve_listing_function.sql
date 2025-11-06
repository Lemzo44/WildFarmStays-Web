-- Create a database function to approve listings with elevated privileges
-- This ensures the update always works, bypassing any potential RLS issues

CREATE OR REPLACE FUNCTION approve_listing(listing_id_param UUID)
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
  -- Update the listing
  UPDATE public.listings
  SET 
    status = 'approved',
    availability = 'available',
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
GRANT EXECUTE ON FUNCTION approve_listing(UUID) TO authenticated;

-- Add a comment
COMMENT ON FUNCTION approve_listing(UUID) IS 'Approves a listing by setting status to approved and availability to available. Requires admin role.';

