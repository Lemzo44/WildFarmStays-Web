-- Add photo upload approval tracking to listings table
-- This tracks when a farmer first approved photo upload access for a listing

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS photo_upload_approved_at TIMESTAMP;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_listings_photo_approval 
ON public.listings(photo_upload_approved_at) 
WHERE photo_upload_approved_at IS NOT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN public.listings.photo_upload_approved_at IS 
'Timestamp when farmer first approved photo upload access for this listing. Once set, the approval modal will not be shown again for this listing.';


