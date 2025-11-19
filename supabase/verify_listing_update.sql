-- Diagnostic script to check listing update behavior
-- Run this after attempting to approve a listing to see what actually happened

-- Check a specific listing by ID (replace with actual listing ID)
-- SELECT id, status, availability, updated_at FROM public.listings WHERE id = 'YOUR_LISTING_ID';

-- Check all pending listings that should be approved
SELECT 
  id,
  title,
  status,
  availability,
  updated_at,
  created_at
FROM public.listings
WHERE status = 'pending' OR availability = 'pending'
ORDER BY updated_at DESC
LIMIT 10;

-- Check if there are any triggers that might be interfering
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'listings';

-- Manually update a listing to test (replace with actual listing ID)
-- UPDATE public.listings 
-- SET status = 'approved', availability = 'available'
-- WHERE id = 'YOUR_LISTING_ID'
-- RETURNING id, status, availability, updated_at;



