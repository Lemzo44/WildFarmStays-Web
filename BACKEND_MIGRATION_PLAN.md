# Backend Database Migration Plan for WildFarmStays

## Overview
This document outlines the complete plan to migrate from localStorage-based data storage to a proper backend database with API integration.

---

## Current State Analysis

### Data Currently Stored in localStorage:
1. **Users** - User accounts (campers and farmers)
2. **Listings** - Farm listings with details
3. **Bookings** - Booking reservations
4. **Reviews** - User reviews for listings
5. **Messages** - Communication between users
6. **Favorites** - Campers' favorite listings
7. **Farmer Ratings** - Ratings for farmers
8. **Current User** - Active session

### Services Using localStorage:
- `LocalStorageService.ts` - Generic localStorage wrapper
- `MockDataService.ts` - Initial data population
- All other services depend on localStorage

---

## Recommended Backend Architecture

### Option 1: Supabase (Recommended for Speed)
**Pros:**
- Fastest to implement (1-2 days)
- Built-in authentication
- Real-time subscriptions
- PostgreSQL database
- Auto-generated REST API
- Free tier available
- Easy migration path

**Cons:**
- Vendor lock-in (can migrate later)
- Less customization than self-hosted

### Option 2: AWS (Node.js + PostgreSQL + RDS)
**Pros:**
- Full control
- Scalable
- Enterprise-grade
- Customizable

**Cons:**
- More complex setup (1-2 weeks)
- Requires server management
- More expensive
- DevOps knowledge needed

### Option 3: Firebase
**Pros:**
- Easy integration
- Real-time database
- Built-in authentication
- Google infrastructure

**Cons:**
- NoSQL (less ideal for relational data)
- Vendor lock-in
- Limited querying compared to SQL

**RECOMMENDATION: Supabase** - Best balance of speed, features, and ease of use

---

## Database Schema Design

### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('camper', 'farmer')),
  
  -- Farmer-specific fields
  farm_name VARCHAR(200),
  farm_address TEXT,
  postcode VARCHAR(20),
  
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
```

### 2. Listings Table
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(200) NOT NULL,
  address VARCHAR(200),
  postcode VARCHAR(20),
  
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  price DECIMAL(10, 2) NOT NULL,
  price_per_night DECIMAL(10, 2),
  max_guests INTEGER DEFAULT 4,
  
  amenities TEXT[],
  images TEXT[],
  
  parking_location TEXT,
  cancellation_policy TEXT,
  
  availability VARCHAR(20) DEFAULT 'available',
  rating DECIMAL(3, 2),
  wildness_rating INTEGER CHECK (wildness_rating BETWEEN 1 AND 5),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Bookings Table
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  listing_title VARCHAR(200) NOT NULL,
  
  camper_id UUID REFERENCES users(id) ON DELETE CASCADE,
  camper_name VARCHAR(200) NOT NULL,
  farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'upcoming')),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Reviews Table
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(listing_id, reviewer_id)
);
```

### 5. Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  
  message_text TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
```

### 6. Favorites Table
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camper_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(camper_id, listing_id)
);
```

### 7. Farmer Ratings Table
```sql
CREATE TABLE farmer_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(farmer_id, reviewer_id)
);
```

---

## Implementation Steps

### Phase 1: Backend Setup (Week 1)

#### 1.1 Create Supabase Project
- [ ] Sign up at supabase.com
- [ ] Create new project "wildfarmstays"
- [ ] Note down API keys and connection strings
- [ ] Set up authentication (email/password enabled)

#### 1.2 Database Schema Setup
- [ ] Create tables using Supabase SQL editor
- [ ] Add indexes for performance
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create foreign key constraints
- [ ] Test relationships between tables

#### 1.3 RLS Policies (Security)
```sql
-- Example: Users can only read their own data
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (auth.uid() = id);

-- Example: Users can read all listings
CREATE POLICY "Anyone can view listings" 
ON listings FOR SELECT 
TO authenticated 
USING (true);
```

### Phase 2: API Integration Layer (Week 1-2)

#### 2.1 Create API Service (new file: `src/services/APIService.ts`)
```typescript
// Centralized API configuration
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

class APIService {
  private client: any; // Supabase client
  
  async get(endpoint: string) { }
  async post(endpoint: string, data: any) { }
  async put(endpoint: string, data: any) { }
  async delete(endpoint: string) { }
}
```

#### 2.2 Update Each Service to Use API
Files to modify:
- [ ] `AuthService.ts` (replace AuthContext)
- [ ] `BookingService.ts`
- [ ] `ListingService.ts` (new, for listings)
- [ ] `ReviewService.ts`
- [ ] `MessageService.ts`
- [ ] `FavoritesService.ts`
- [ ] `FarmerRatingService.ts`

**Pattern for each service:**
```typescript
// Old way (localStorage)
export class BookingService {
  static async getAll() {
    return LocalStorageService.getAll('bookings');
  }
}

// New way (API)
export class BookingService {
  static async getAll() {
    return APIService.get('/bookings');
  }
}
```

### Phase 3: Authentication Migration (Week 2)

#### 3.1 Replace AuthContext
- [ ] Install Supabase client library
- [ ] Update `AuthContext.tsx` to use Supabase auth
- [ ] Implement proper JWT token handling
- [ ] Add automatic token refresh
- [ ] Test login/logout/register flows

#### 3.2 Session Management
- [ ] Replace localStorage user storage with session tokens
- [ ] Add automatic re-authentication on page reload
- [ ] Add "Remember me" functionality

### Phase 4: Data Migration (Week 2-3)

#### 4.1 Create Migration Script
```typescript
// scripts/migrate-data.ts
// - Read current localStorage data
// - Transform to new schema
// - Upload to Supabase via API
```

#### 4.2 Migrate Existing Data
- [ ] Export current localStorage data
- [ ] Transform mock data to new schema
- [ ] Import into Supabase
- [ ] Verify data integrity
- [ ] Test with real accounts

### Phase 5: Frontend Updates (Week 3)

#### 5.1 Environment Variables
Create `.env` file:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

#### 5.2 Update All Components
- [ ] Replace all localStorage calls with API calls
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test each screen:
  - [ ] Login/Register
  - [ ] Listings display
  - [ ] Booking creation
  - [ ] Reviews
  - [ ] Messages
  - [ ] Favorites
  - [ ] Profile

#### 5.3 Remove Deprecated Code
- [ ] Delete `LocalStorageService.ts`
- [ ] Delete `MockDataService.ts`
- [ ] Remove localStorage initialization
- [ ] Clean up unused imports

### Phase 6: Testing & Deployment (Week 4)

#### 6.1 Testing
- [ ] Unit tests for API service
- [ ] Integration tests for user flows
- [ ] Test with multiple users
- [ ] Test concurrent operations
- [ ] Performance testing

#### 6.2 Security Audit
- [ ] Review RLS policies
- [ ] Test authentication bypass attempts
- [ ] Validate input sanitization
- [ ] Check for SQL injection vulnerabilities

#### 6.3 Deployment
- [ ] Update Vercel deployment
- [ ] Set environment variables in Vercel
- [ ] Test on production
- [ ] Monitor for errors
- [ ] Set up error logging

---

## API Endpoints Required

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/session` - Get current session
- `POST /auth/reset-password` - Password reset

### Users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `GET /users/:id/bookings` - Get user bookings
- `GET /users/:id/listings` (farmer only)

### Listings
- `GET /listings` - Get all listings
- `GET /listings/:id` - Get single listing
- `POST /listings` - Create new listing
- `PUT /listings/:id` - Update listing
- `DELETE /listings/:id` - Delete listing
- `GET /listings/search?query=xxx` - Search listings

### Bookings
- `GET /bookings` - Get all bookings (filtered by user)
- `POST /bookings` - Create booking
- `PUT /bookings/:id` - Update booking
- `GET /bookings/availability?listing=xxx&start=xxx&end=xxx`

### Reviews
- `GET /listings/:id/reviews` - Get listing reviews
- `POST /reviews` - Create review
- `GET /reviews/stats/:listingId` - Get review statistics

### Messages
- `GET /messages/conversations` - Get user conversations
- `GET /messages/conversation/:id` - Get conversation messages
- `POST /messages` - Send message

### Favorites
- `GET /favorites` - Get user favorites
- `POST /favorites` - Add favorite
- `DELETE /favorites/:listingId` - Remove favorite
- `GET /favorites/:listingId` - Check if favorited

---

## Risk Mitigation

### Risks:
1. **Data Loss During Migration**
   - **Mitigation:** Export localStorage as backup before migration
   - **Rollback Plan:** Keep localStorage code as fallback

2. **Breaking Existing Functionality**
   - **Mitigation:** Implement feature flags to switch between localStorage and API
   - **Testing:** Thorough testing before removing localStorage code

3. **Performance Issues**
   - **Mitigation:** Add caching layer
   - **Database:** Optimize queries and add indexes

4. **Cost Overruns**
   - **Mitigation:** Monitor Supabase usage
   - **Budget:** Start with free tier, scale as needed

---

## Timeline Estimate

- **Phase 1:** 2-3 days (Backend setup)
- **Phase 2:** 3-4 days (API integration)
- **Phase 3:** 2 days (Authentication)
- **Phase 4:** 2 days (Data migration)
- **Phase 5:** 3-4 days (Frontend updates)
- **Phase 6:** 2 days (Testing & deployment)

**Total: 2-3 weeks**

---

## Success Criteria

1. ✅ All data stored in Supabase database
2. ✅ Authentication working with JWT tokens
3. ✅ All CRUD operations working via API
4. ✅ Performance acceptable (< 500ms response time)
5. ✅ No data loss during migration
6. ✅ Existing functionality preserved
7. ✅ Production deployment successful
8. ✅ Error handling implemented
9. ✅ Security policies in place

---

## Next Steps

Once approved, we will:
1. Create Supabase project
2. Design database schema
3. Set up authentication
4. Begin API integration
5. Migrate data
6. Test thoroughly
7. Deploy to production

---

## Questions for Stakeholder

1. **Which backend option do you prefer?** (Recommended: Supabase)
2. **What is the timeline for implementation?** 
3. **Do you want to keep localStorage as fallback?**
4. **What is the budget for backend services?**
5. **Any specific security requirements?**


