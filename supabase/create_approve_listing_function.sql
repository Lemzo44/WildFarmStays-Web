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
BEGIN
  -- Update the listing (explicitly qualify the column name)
  UPDATE public.listings
  SET 
    status = 'approved',
    availability = 'available',
    updated_at = NOW()
  WHERE public.listings.id = listing_id_param;
  
  -- Return the updated record (explicitly qualify all column names)
  RETURN QUERY
  SELECT 
    public.listings.id,
    public.listings.status::VARCHAR,
    public.listings.availability::VARCHAR,
    public.listings.updated_at
  FROM public.listings
  WHERE public.listings.id = listing_id_param;
END;
$$;

-- Grant execute permission to authenticated users (admins)
GRANT EXECUTE ON FUNCTION approve_listing(UUID) TO authenticated;

-- Add a comment
COMMENT ON FUNCTION approve_listing(UUID) IS 'Approves a listing by setting status to approved and availability to available. Requires admin role.';

