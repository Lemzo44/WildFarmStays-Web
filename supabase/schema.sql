-- WildFarmStays Database Schema for Supabase
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
-- Note: Supabase has built-in auth.users table. This is for additional profile data.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('camper', 'farmer', 'admin')),
  
  -- Farmer-specific fields
  farm_name VARCHAR(200),
  farm_address TEXT,
  postcode VARCHAR(20),
  county VARCHAR(100),
  
  -- Subscription fields
  subscription_status VARCHAR(20) DEFAULT 'active',
  subscription_type VARCHAR(20),
  subscription_start_date DATE,
  subscription_end_date DATE,
  
  verified BOOLEAN DEFAULT false,
  join_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Listings Table
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(200) NOT NULL,
  address VARCHAR(200),
  postcode VARCHAR(20),
  county VARCHAR(100),
  
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  price DECIMAL(10, 2) NOT NULL,
  price_per_night DECIMAL(10, 2),
  max_guests INTEGER DEFAULT 4,
  
  amenities TEXT[] DEFAULT '{}',
  restrictions TEXT[] DEFAULT '{}',
  seasonal_highlights TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  
  parking_location TEXT,
  cancellation_policy TEXT,
  
  availability VARCHAR(20) DEFAULT 'available' CHECK (availability IN ('available', 'pending', 'suspended')),
  rating DECIMAL(3, 2),
  wildness_rating INTEGER CHECK (wildness_rating BETWEEN 1 AND 5),
  review_count INTEGER DEFAULT 0,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'live')),
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Bookings Table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  listing_title VARCHAR(200) NOT NULL,
  
  camper_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  camper_name VARCHAR(200) NOT NULL,
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  guests INTEGER DEFAULT 1,
  special_requests TEXT,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'upcoming')),
  
  -- Waiver fields
  waiver_accepted BOOLEAN DEFAULT false,
  waiver_type VARCHAR(50),
  waiver_accepted_at TIMESTAMP,
  waiver_text_snapshot TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Reviews Table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(200),
  comment TEXT,
  
  approved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(listing_id, reviewer_id)
);

-- 5. Messages Table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  
  message_text TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Favorites Table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camper_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(camper_id, listing_id)
);

-- 7. Farmer Ratings Table
CREATE TABLE public.farmer_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(farmer_id, reviewer_id)
);

-- 8. Support Tickets Table (for admin)
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  name VARCHAR(200),
  email VARCHAR(255),
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_listings_farmer_id ON public.listings(farmer_id);
CREATE INDEX idx_listings_county ON public.listings(county);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_bookings_camper_id ON public.bookings(camper_id);
CREATE INDEX idx_bookings_farmer_id ON public.bookings(farmer_id);
CREATE INDEX idx_bookings_listing_id ON public.bookings(listing_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_reviews_listing_id ON public.reviews(listing_id);
CREATE INDEX idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_favorites_camper_id ON public.favorites(camper_id);
CREATE INDEX idx_favorites_listing_id ON public.favorites(listing_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Listings Policies
CREATE POLICY "Anyone can view approved listings"
  ON public.listings FOR SELECT
  USING (status = 'approved' OR status = 'live');

CREATE POLICY "Farmers can view own listings"
  ON public.listings FOR SELECT
  USING (farmer_id = auth.uid());

CREATE POLICY "Admins can view all listings"
  ON public.listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Farmers can create listings"
  ON public.listings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'farmer'
    ) AND farmer_id = auth.uid()
  );

CREATE POLICY "Farmers can update own listings"
  ON public.listings FOR UPDATE
  USING (farmer_id = auth.uid());

-- Bookings Policies
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (
    camper_id = auth.uid() OR
    farmer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Campers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'camper'
    ) AND camper_id = auth.uid()
  );

CREATE POLICY "Farmers and admins can update bookings"
  ON public.bookings FOR UPDATE
  USING (
    farmer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reviews Policies
CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews FOR SELECT
  USING (approved = true);

CREATE POLICY "Users can view own reviews"
  ON public.reviews FOR SELECT
  USING (reviewer_id = auth.uid());

CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

-- Messages Policies
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Favorites Policies
CREATE POLICY "Users can manage own favorites"
  ON public.favorites FOR ALL
  USING (camper_id = auth.uid())
  WITH CHECK (camper_id = auth.uid());

-- Farmer Ratings Policies
CREATE POLICY "Anyone can view farmer ratings"
  ON public.farmer_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create farmer ratings"
  ON public.farmer_ratings FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

-- Support Tickets Policies (simplified - can be enhanced)
CREATE POLICY "Users can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


