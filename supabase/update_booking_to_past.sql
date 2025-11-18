-- Update a booking to be in the past (for testing reviews)
-- Replace 'BOOKING_ID_HERE' with the actual booking ID

-- Option 1: Update a specific booking by ID
UPDATE public.bookings
SET 
  start_date = (now() - interval '14 days')::date,
  end_date = (now() - interval '10 days')::date,
  status = 'completed'
WHERE id = 'BOOKING_ID_HERE';

-- Option 2: Update the most recent booking for a specific camper
-- Replace 'CAMPER_EMAIL_HERE' with the camper's email
UPDATE public.bookings
SET 
  start_date = (now() - interval '14 days')::date,
  end_date = (now() - interval '10 days')::date,
  status = 'completed'
WHERE id = (
  SELECT b.id
  FROM public.bookings b
  JOIN public.profiles p ON p.id::text = b.camper_id
  WHERE p.email = 'CAMPER_EMAIL_HERE'
  ORDER BY b.created_at DESC
  LIMIT 1
);

-- Option 3: Update all pending/confirmed bookings for a camper to completed (be careful!)
-- Replace 'CAMPER_EMAIL_HERE' with the camper's email
UPDATE public.bookings
SET 
  start_date = (now() - interval '14 days')::date,
  end_date = (now() - interval '10 days')::date,
  status = 'completed'
WHERE camper_id = (
  SELECT id::text
  FROM public.profiles
  WHERE email = 'CAMPER_EMAIL_HERE'
  LIMIT 1
)
AND status IN ('pending', 'confirmed');

-- Verify the update
SELECT 
  b.id,
  b.listing_title,
  b.start_date,
  b.end_date,
  b.status,
  p.email as camper_email
FROM public.bookings b
LEFT JOIN public.profiles p ON p.id::text = b.camper_id
WHERE b.id = 'BOOKING_ID_HERE';  -- Replace with the booking ID you updated



