-- View all reviews with details
SELECT 
  r.id AS review_id,
  r.listing_id,
  l.title AS listing_title,
  r.reviewer_id,
  p.first_name || ' ' || p.last_name AS reviewer_name,
  r.rating,
  r.title AS review_title,
  r.comment,
  r.approved,
  r.created_at
FROM public.reviews r
LEFT JOIN public.listings l ON l.id = r.listing_id
LEFT JOIN public.profiles p ON p.id = r.reviewer_id
ORDER BY r.created_at DESC;

-- Delete a specific review (replace 'REVIEW_ID_HERE' with actual review ID)
-- DELETE FROM public.reviews WHERE id = 'REVIEW_ID_HERE';

-- Delete all reviews for a specific listing (replace 'LISTING_ID_HERE')
-- DELETE FROM public.reviews WHERE listing_id = 'LISTING_ID_HERE';

-- Delete all reviews by a specific reviewer (replace 'REVIEWER_ID_HERE' with camper's profile ID)
-- DELETE FROM public.reviews WHERE reviewer_id = 'REVIEWER_ID_HERE';

-- Find reviews for a specific listing
SELECT 
  r.id,
  p.email AS reviewer_email,
  r.rating,
  r.title,
  r.created_at
FROM public.reviews r
LEFT JOIN public.profiles p ON p.id = r.reviewer_id
WHERE r.listing_id = 'LISTING_ID_HERE'
ORDER BY r.created_at DESC;

