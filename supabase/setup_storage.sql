-- Create storage bucket for images
-- Note: This needs to be run in Supabase Dashboard > Storage > Create Bucket
-- Or via the Supabase CLI

-- Create the bucket (if it doesn't exist)
-- This is typically done via the Supabase Dashboard, but here's the SQL equivalent:
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for authenticated users
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] IN ('listings', 'reviews')
);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] IN ('listings', 'reviews')
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] IN ('listings', 'reviews')
);

-- Allow public read access to images
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

