-- Complete Test Data Seed Script
-- Run this in Supabase SQL Editor to create a full set of test data
-- Includes: farmers, listings, bookings, reviews, messages, favorites, tickets
--
-- WARNING: This will create multiple test records. Use in development/test environment only!

DO $$
DECLARE
    -- Store generated IDs
    test_farmer_id UUID;
    test_camper_id UUID;
    test_listing_id UUID;
    test_booking_id UUID;
    test_review_id UUID;
    i INTEGER;
BEGIN
    RAISE NOTICE 'Starting test data seed...';
    
    -- Step 1: Get or create a farmer
    SELECT id INTO test_farmer_id 
    FROM public.profiles 
    WHERE role = 'farmer' 
    LIMIT 1;
    
    IF test_farmer_id IS NULL THEN
        RAISE NOTICE 'No farmer found. Please create a farmer user first via the app registration, then run this script again.';
        RETURN;
    END IF;
    
    -- Step 2: Get or create a camper
    SELECT id INTO test_camper_id 
    FROM public.profiles 
    WHERE role = 'camper' 
    LIMIT 1;
    
    IF test_camper_id IS NULL THEN
        RAISE NOTICE 'No camper found. Please create a camper user first via the app registration, then run this script again.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Using farmer_id: % and camper_id: %', test_farmer_id, test_camper_id;
    
    -- Step 3: Create listings (if they don't exist)
    INSERT INTO public.listings (
        farmer_id,
        title,
        description,
        location,
        address,
        county,
        latitude,
        longitude,
        price,
        price_per_night,
        max_guests,
        amenities,
        restrictions,
        parking_location,
        cancellation_policy,
        availability,
        rating,
        wildness_rating,
        review_count,
        status
    )
    SELECT
        test_farmer_id,
        'Mountain View Organic Farm',
        'Experience authentic farm life with stunning mountain views.',
        'Cork County, Ireland',
        'Farm Road, Cork',
        'Cork',
        51.8985,
        -8.4756,
        45.00,
        45.00,
        4,
        ARRAY['Water tap', 'Fire pit', 'Composting toilet'],
        ARRAY['No pets allowed'],
        'Designated parking area',
        'Free cancellation up to 7 days',
        'available',
        4.5,
        4,
        12,
        'approved'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.listings WHERE farmer_id = test_farmer_id LIMIT 1
    )
    RETURNING id INTO test_listing_id;
    
    IF test_listing_id IS NULL THEN
        SELECT id INTO test_listing_id 
        FROM public.listings 
        WHERE farmer_id = test_farmer_id 
        LIMIT 1;
    END IF;
    
    RAISE NOTICE 'Using listing_id: %', test_listing_id;
    
    -- Step 4: Create bookings
    INSERT INTO public.bookings (
        listing_id,
        listing_title,
        camper_id,
        camper_name,
        farmer_id,
        start_date,
        end_date,
        total_price,
        guests,
        status,
        waiver_accepted,
        waiver_type,
        waiver_accepted_at,
        waiver_text_snapshot
    ) VALUES (
        test_listing_id,
        'Mountain View Organic Farm',
        test_camper_id,
        'Test Camper',
        test_farmer_id,
        CURRENT_DATE + INTERVAL '7 days',
        CURRENT_DATE + INTERVAL '10 days',
        135.00,
        2,
        'confirmed',
        true,
        'republic_ireland',
        NOW(),
        'Test waiver text snapshot'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO test_booking_id;
    
    RAISE NOTICE 'Created booking_id: %', test_booking_id;
    
    -- Step 5: Create a review
    IF test_booking_id IS NOT NULL THEN
        INSERT INTO public.reviews (
            listing_id,
            reviewer_id,
            booking_id,
            rating,
            title,
            comment,
            approved
        ) VALUES (
            test_listing_id,
            test_camper_id,
            test_booking_id,
            5,
            'Amazing experience!',
            'We had a wonderful stay at this farm. Highly recommended!',
            true
        )
        ON CONFLICT (listing_id, reviewer_id) DO NOTHING
        RETURNING id INTO test_review_id;
        
        RAISE NOTICE 'Created review_id: %', test_review_id;
    END IF;
    
    -- Step 6: Create a favorite
    INSERT INTO public.favorites (
        camper_id,
        listing_id
    ) VALUES (
        test_camper_id,
        test_listing_id
    )
    ON CONFLICT (camper_id, listing_id) DO NOTHING;
    
    RAISE NOTICE 'Created favorite';
    
    -- Step 7: Create a support ticket
    INSERT INTO public.support_tickets (
        user_id,
        name,
        email,
        subject,
        message,
        status
    ) VALUES (
        test_camper_id,
        'Test User',
        'test@example.com',
        'Test Inquiry',
        'This is a test support ticket created by the seed script.',
        'open'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created support ticket';
    
    RAISE NOTICE 'Test data seed completed successfully!';
    
END $$;

-- Verify all data was created
SELECT 'Listings' as table_name, COUNT(*) as count FROM public.listings
UNION ALL
SELECT 'Bookings', COUNT(*) FROM public.bookings
UNION ALL
SELECT 'Reviews', COUNT(*) FROM public.reviews
UNION ALL
SELECT 'Favorites', COUNT(*) FROM public.favorites
UNION ALL
SELECT 'Support Tickets', COUNT(*) FROM public.support_tickets
UNION ALL
SELECT 'Messages', COUNT(*) FROM public.messages;


