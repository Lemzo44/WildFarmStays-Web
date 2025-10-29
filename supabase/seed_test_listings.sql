-- Seed Test Listings Script
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- 
-- Prerequisites:
-- 1. Ensure you have at least one farmer user in the profiles table
-- 2. If you don't have farmers, first run: supabase/create_test_farmers.sql (see below)
--
-- This script creates 10 diverse test listings with different:
-- - Statuses (pending, approved, live, rejected)
-- - Counties (ROI and Northern Ireland)
-- - Prices and amenities
-- - Ratings and review counts

-- First, let's get a farmer_id to use (or you can replace with a specific UUID)
DO $$
DECLARE
    test_farmer_id UUID;
    listing_uuid UUID;
    i INTEGER;
    counties TEXT[] := ARRAY['Cork', 'Kerry', 'Galway', 'Mayo', 'Donegal', 'Antrim', 'Down', 'Derry', 'Tyrone', 'Fermanagh'];
    roi_counties TEXT[] := ARRAY['Cork', 'Kerry', 'Galway', 'Mayo', 'Donegal'];
    ni_counties TEXT[] := ARRAY['Antrim', 'Down', 'Derry', 'Tyrone', 'Fermanagh'];
    statuses TEXT[] := ARRAY['pending', 'pending', 'approved', 'approved', 'live', 'live', 'live', 'rejected', 'rejected', 'pending'];
    prices DECIMAL[] := ARRAY[45.00, 35.00, 55.00, 60.00, 40.00, 50.00, 70.00, 45.00, 30.00, 65.00];
    titles TEXT[] := ARRAY[
        'Mountain View Organic Farm',
        'Coastal Camper Paradise',
        'Riverside Farm Retreat',
        'Highland Sheep Farm',
        'Forest Edge Campsite',
        'Lakeside Farm Stay',
        'Traditional Irish Farm',
        'Meadow View Campsite',
        'Valley Farm Experience',
        'Countryside Escape'
    ];
    descriptions TEXT[] := ARRAY[
        'Experience authentic farm life with stunning mountain views. Perfect for families seeking adventure.',
        'Wake up to ocean sounds at this peaceful coastal campsite. Direct beach access included.',
        'Tranquil riverside location with fishing opportunities. Great for nature enthusiasts.',
        'Working sheep farm in the highlands. Learn about sheep farming during your stay.',
        'Secluded forest edge location, perfect for stargazing. Modern facilities with rustic charm.',
        'Beautiful lakeside setting with paddle board hire. BBQ facilities and fire pit available.',
        'Traditional Irish farmhouse experience with heritage buildings and organic produce.',
        'Open meadow views with wildflower fields. Family-friendly with play area for children.',
        'Nestled in a quiet valley, this farm offers complete tranquility away from city life.',
        'Classic countryside setting with walking trails and farm animals. Ideal for city escape.'
    ];
    -- Flat amenity options list (we'll randomly pick 3–6 per listing)
    amenities_options TEXT[] := ARRAY[
        'Drinking water', 'Compost toilet', 'Fire pit', 'Wildlife watching',
        'Nature trails', 'Farm produce', 'Secluded pitch', 'Picnic area',
        'Firewood supply', 'Bird hides', 'Fishing access', 'Wildflower meadow',
        'Hammock stands', 'Meadow access', 'Seasonal fruits', 'Farm tours',
        'Stargazing spots', 'Herb garden', 'Orchard access', 'Wooded areas',
        'Farm animals', 'Bee colonies', 'Compost bins', 'Kayaking',
        'Bird feeders', 'Dog-friendly', 'Hiking paths', 'Wildlife guides',
        'Rustic benches', 'Swimming'
    ];
    amenities_current TEXT[];
    current_county TEXT;
    current_status TEXT;
    rejection_reason TEXT;
BEGIN
    -- Get the first farmer user (or create one if needed)
    SELECT id INTO test_farmer_id 
    FROM public.profiles 
    WHERE role = 'farmer' 
    LIMIT 1;
    
    -- If no farmer exists, create a test farmer first
    IF test_farmer_id IS NULL THEN
        RAISE NOTICE 'No farmer found. Please create a farmer user first, or see supabase/create_test_farmers.sql';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Using farmer_id: %', test_farmer_id;
    
    -- Create 10 test listings
    FOR i IN 1..10 LOOP
        -- Set current values based on iteration
        current_status := statuses[i];
        current_county := counties[i];
        
        -- Determine rejection reason if status is rejected
        IF current_status = 'rejected' THEN
            rejection_reason := 'Images need improvement and description is too brief. Please add more details about farm activities and amenities.';
        ELSE
            rejection_reason := NULL;
        END IF;
        
        -- Build a random amenities array of 3–6 items (no rectangular array issues)
        SELECT array_agg(a)
        INTO amenities_current
        FROM (
            SELECT unnest(amenities_options) a
            ORDER BY random()
            LIMIT (3 + (random() * 3))::INT  -- 3 to 6 items
        ) s;

        -- Insert listing
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
            seasonal_highlights,
            images,
            parking_location,
            cancellation_policy,
            availability,
            rating,
            wildness_rating,
            review_count,
            status,
            rejection_reason
        ) VALUES (
            test_farmer_id,
            titles[i],
            descriptions[i],
            current_county || ' County, Ireland',
            (CASE 
                WHEN current_county = ANY(roi_counties) THEN 'Farm Road, ' || current_county
                ELSE current_county || ' Farm Lane, Northern Ireland'
            END),
            current_county,
            -- Latitude (Ireland ranges from ~51.4 to 55.4)
            53.0 + (RANDOM() * 2.4)::DECIMAL(10,8),
            -- Longitude (Ireland ranges from ~-10.5 to -5.9)
            -8.0 - (RANDOM() * 2.6)::DECIMAL(11,8),
            prices[i],
            prices[i],
            4 + (RANDOM() * 2)::INTEGER, -- Max guests 4-6
            amenities_current,
            ARRAY['No pets allowed', 'Quiet hours after 10pm'],
            ARRAY['Spring: Lambing season', 'Summer: Wildflowers', 'Autumn: Harvest time', 'Winter: Cosy farmhouse'],
            ARRAY['https://example.com/farm-image-1.jpg', 'https://example.com/farm-image-2.jpg'],
            'Designated parking area near entrance',
            'Free cancellation up to 7 days before check-in',
            CASE 
                WHEN current_status IN ('approved', 'live') THEN 'available'
                WHEN current_status = 'rejected' THEN 'pending'
                ELSE 'pending'
            END,
            4.0 + (RANDOM() * 1.0)::DECIMAL(3,2), -- Rating 4.0-5.0
            3 + (RANDOM() * 2)::INTEGER, -- Wildness rating 3-5
            (RANDOM() * 50)::INTEGER, -- Review count 0-50
            current_status,
            rejection_reason
        );
        
        RAISE NOTICE 'Created listing %: % (Status: %, County: %)', i, titles[i], current_status, current_county;
    END LOOP;
    
    RAISE NOTICE 'Successfully created 10 test listings!';
END $$;

-- Verify the listings were created
SELECT 
    id,
    title,
    county,
    status,
    availability,
    price_per_night,
    max_guests,
    farmer_id
FROM public.listings
ORDER BY created_at DESC
LIMIT 10;

