-- Add photo upload approval tracking to reviews table
-- This tracks when a camper first approved photo upload access for a review

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS photo_upload_approved_at TIMESTAMP;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_photo_approval 
ON public.reviews(photo_upload_approved_at) 
WHERE photo_upload_approved_at IS NOT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN public.reviews.photo_upload_approved_at IS 
'Timestamp when camper first approved photo upload access for this review. Set when review is submitted with images.';


