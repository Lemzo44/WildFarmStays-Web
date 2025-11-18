-- Test script to manually approve a listing and verify the update works
-- Replace 'YOUR_LISTING_ID' with an actual listing ID

-- First, check current state
SELECT 
  id,
  title,
  status,
  availability,
  updated_at
FROM public.listings
WHERE id = 'YOUR_LISTING_ID';

-- Update the listing
UPDATE public.listings 
SET 
  status = 'approved',
  availability = 'available',
  updated_at = NOW()
WHERE id = 'YOUR_LISTING_ID'
RETURNING id, status, availability, updated_at;

-- Verify the update
SELECT 
  id,
  title,
  status,
  availability,
  updated_at
FROM public.listings
WHERE id = 'YOUR_LISTING_ID';

-- Check if there are any constraints or triggers that might prevent the update
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.listings'::regclass
  AND (conname LIKE '%status%' OR conname LIKE '%availability%');

-- Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'listings';


