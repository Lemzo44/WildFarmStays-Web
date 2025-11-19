-- Get all booking IDs with details
SELECT 
  b.id AS booking_id,
  b.listing_title,
  p_camper.email AS camper_email,
  p_farmer.email AS farmer_email,
  b.start_date,
  b.end_date,
  b.status,
  b.created_at,
  b.total_price
FROM public.bookings b
LEFT JOIN public.profiles p_camper ON p_camper.id::text = b.camper_id
LEFT JOIN public.profiles p_farmer ON p_farmer.id::text = b.farmer_id
ORDER BY b.created_at DESC;

-- Or just the IDs in a simple list
SELECT id AS booking_id, listing_title, status, start_date, end_date
FROM public.bookings
ORDER BY created_at DESC;

-- Or just the IDs for copy-paste
SELECT id
FROM public.bookings
ORDER BY created_at DESC;




