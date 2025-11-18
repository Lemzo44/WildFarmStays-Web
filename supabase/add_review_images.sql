-- Add images field to reviews table for camper review photos
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Add comment explaining the field
COMMENT ON COLUMN public.reviews.images IS 'Array of image URLs uploaded by campers with their review (max 3 images)';


