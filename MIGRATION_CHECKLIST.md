# Supabase Migration Checklist - WildFarmStays

## ✅ Completed

### Infrastructure
- [x] Supabase project created and configured
- [x] Database schema deployed (`supabase/schema.sql`)
- [x] Environment variables set up (`.env`)
- [x] Supabase client initialized (`src/lib/supabase.ts`)
- [x] APIService created with Supabase integration (`src/services/APIService.ts`)
- [x] Feature flag implemented (`VITE_USE_SUPABASE`)
- [x] Row Level Security (RLS) policies configured

### Authentication
- [x] `AuthContext.tsx` migrated to Supabase Auth
- [x] Login using `supabase.auth.signInWithPassword`
- [x] Registration using `supabase.auth.signUp` + profile creation
- [x] Logout using `supabase.auth.signOut`
- [x] Session management with Supabase sessions
- [x] User profile loading from `public.profiles`
- [x] Admin user creation process documented

### Data Storage - Partially Complete
- [x] **Bookings**: `BookingService` uses Supabase (via APIService) when `VITE_USE_SUPABASE=true`
- [x] **Listings**: `ListingManagement.tsx` uses Supabase for admin approval/rejection
- [x] **Profiles**: Stored in `public.profiles` via registration

---

## ⏳ In Progress / Partially Complete

### Services - Need Full Migration
- [ ] **BookingService.ts** ⚠️ Partially migrated
  - ✅ `checkAvailability()` - Uses Supabase
  - ✅ `getUserBookings()` - Uses Supabase  
  - ✅ `createBooking()` - Uses Supabase (with waiver support)
  - ✅ `updateBookingStatus()` - Uses Supabase
  - ❌ Still has localStorage fallback code (acceptable for now)

- [x] **ListingService** (doesn't exist yet - listings managed directly)
  - ✅ `CreateListingScreen.tsx` - **Migrated to Supabase**
  - ✅ `ListingsScreen.tsx` - **Migrated to Supabase**
  - ✅ `EditListingScreen.tsx` - **Migrated to Supabase**
  - ✅ `ListingManagement.tsx` - **Migrated to Supabase**
  - ✅ `SearchScreen.tsx` - **Migrated to Supabase**
  - ✅ `FarmerHomeScreen.tsx` - **Migrated to Supabase**

---

## ❌ Not Started / Outstanding

### Services - Need Migration
- [ ] **ReviewService.ts**
  - Uses: `LocalStorageService` for all operations
  - Methods to migrate:
    - [ ] `createReview()`
    - [ ] `getReviewsByListing()`
    - [ ] `getReviewsByUser()`
    - [ ] `getApprovedReviews()`
    - [ ] `getReviewStats()`
    - [ ] `getAllReviews()` (admin)
    - [ ] `deleteReview()`
  - Tables: `public.reviews`

- [ ] **MessageService.ts**
  - Uses: `LocalStorageService` for all operations
  - Methods to migrate:
    - [ ] `sendMessage()`
    - [ ] `getConversations()`
    - [ ] `getMessagesForConversation()`
    - [ ] `markAsRead()`
    - [ ] `getUnreadCount()`
  - Tables: `public.messages`

- [ ] **FavoritesService.ts**
  - Uses: `LocalStorageService` for all operations
  - Methods to migrate:
    - [ ] `addFavorite()`
    - [ ] `removeFavorite()`
    - [ ] `getUserFavorites()`
    - [ ] `isFavorite()`
    - [ ] `getFavoriteListingsWithDetails()`
  - Tables: `public.favorites`

- [ ] **FarmerRatingService.ts**
  - Uses: `LocalStorageService` for all operations
  - Methods to migrate:
    - [ ] `createRating()`
    - [ ] `getRatingsByFarmer()`
    - [ ] `getAverageRating()`
    - [ ] `canUserRateFarmer()`
    - [ ] `updateRating()`
    - [ ] `deleteRating()`
  - Tables: `public.farmer_ratings`

- [ ] **BookingManagementService.ts**
  - Uses: `LocalStorageService` for all operations
  - Methods to migrate:
    - [ ] `confirmBooking()`
    - [ ] `cancelBooking()`
    - [ ] `updateBookingStatus()`
  - Note: This may overlap with `BookingService` - consider consolidation

### Screens - Need Migration
- [x] **CreateListingScreen.tsx** - ✅ Migrated to Supabase
- [x] **ListingsScreen.tsx** - ✅ Migrated to Supabase
- [x] **EditListingScreen.tsx** - ✅ Migrated to Supabase
- [x] **SearchScreen.tsx** - ✅ Migrated to Supabase
- [x] **FarmerHomeScreen.tsx** - ✅ Migrated to Supabase
- [ ] **ReviewsScreen.tsx** - Displays reviews
- [ ] **BookingDetailsScreen.tsx** - Booking details view
- [ ] **BookingManagement.tsx** - Admin booking management
- [ ] **AdminBookingDetails.tsx** - Admin booking details
- [ ] **UserManagement.tsx** - Admin user management
- [ ] **UserDetails.tsx** - Admin user details
- [ ] **SupportTickets.tsx** - Support ticket management
- [ ] **TicketDetails.tsx** - Support ticket details
- [ ] **ContactUsScreen.tsx** - Contact form submission
- [ ] **FarmerRatingScreen.tsx** - Farmer rating display
- [ ] **HomeScreen.tsx** - Camper home (already uses `BookingService`, but check for other localStorage calls)

### Additional Tables/Features
- [ ] **Support Tickets** (`public.support_tickets`)
  - Table exists in schema
  - No service created yet
  - Screens exist but not connected to backend

---

## 🔄 Migration Pattern (for reference)

For each service, follow this pattern:

```typescript
// OLD (localStorage only)
import { LocalStorageService } from './LocalStorageService';

static async getAll() {
  return await LocalStorageService.getAll('tableName');
}

// NEW (Supabase with fallback)
import { APIService } from './APIService';
import { useSupabase } from '../lib/supabase';

static async getAll() {
  if (useSupabase) {
    return await APIService.get('tableName');
  }
  // Fallback to localStorage
  return await LocalStorageService.getAll('tableName');
}
```

---

## 📋 Priority Order (Recommended)

### Phase 1: Core Listing Management (High Priority) ✅ COMPLETE
1. ✅ **ListingManagement.tsx** - Admin approval/rejection (DONE)
2. ✅ **CreateListingScreen.tsx** - Farmers create listings (DONE)
3. ✅ **ListingsScreen.tsx** - View all listings (DONE)
4. ✅ **EditListingScreen.tsx** - Edit listings (DONE)
5. ✅ **SearchScreen.tsx** - Search functionality (DONE)
6. ✅ **FarmerHomeScreen.tsx** - Farmer dashboard (DONE)

### Phase 2: Reviews & Ratings (Medium Priority)
6. [ ] **ReviewService.ts** - Migrate review operations
7. [ ] **ReviewsScreen.tsx** - Display reviews
8. [ ] **FarmerRatingService.ts** - Migrate farmer ratings
9. [ ] **FarmerRatingScreen.tsx** - Display farmer ratings

### Phase 3: Communication (Medium Priority)
10. [ ] **MessageService.ts** - Migrate messaging
11. [ ] Message-related screens

### Phase 4: User Features (Lower Priority)
12. [ ] **FavoritesService.ts** - Migrate favorites
13. [ ] **BookingManagementService.ts** - Migrate booking management
14. [ ] Admin screens (UserManagement, SupportTickets, etc.)

---

## ✅ Verification Checklist

After migrating each service:
- [ ] Update service to use `APIService` with `useSupabase` check
- [ ] Test CRUD operations (Create, Read, Update, Delete)
- [ ] Verify RLS policies work correctly
- [ ] Test with both authenticated and unauthenticated users
- [ ] Check error handling and fallback behavior
- [ ] Verify data appears in Supabase dashboard
- [ ] Test related screens that use the service
- [ ] Remove old localStorage code (optional - keep for rollback if needed)

---

## 🐛 Known Issues / Notes

1. **Listings Status vs Availability**: 
   - Schema has both `status` (pending/approved/rejected/live) and `availability` (available/pending/suspended)
   - Some screens may still use old `availability` field - needs audit

2. **Field Name Mismatches**:
   - Database uses snake_case (`farmer_id`, `rejection_reason`)
   - App sometimes uses camelCase (`farmerId`, `rejectionReason`)
   - Some places handle both - needs consistency

3. **BookingService**:
   - Currently has complex logic with direct Supabase calls
   - Consider refactoring to use APIService consistently

---

## 📊 Progress Summary

**Overall Progress: ~45%**

- ✅ Infrastructure: 100% (5/5)
- ✅ Authentication: 100% (5/5)
- ⚠️ Services: 20% (1/5 major services fully migrated)
- ✅ Screens: 37% (7/19 screens migrated)

**Phase 1 Complete! ✅**
- All listing management screens migrated to Supabase
- Farmers can create, edit, and view their listings
- Campers can search and view approved listings
- Admin can approve/reject listings

**Next Steps (Phase 2):**
1. Migrate `ReviewService` (users expect reviews)
2. Migrate `MessageService` (core communication feature)
3. Migrate `FavoritesService` (user favorites)

