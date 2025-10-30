# End-to-End Test Plan for Supabase Migration

**Version:** 1.0  
**Date:** 2024  
**Scope:** Complete validation of all migrated features from localStorage to Supabase

---

## Pre-Test Setup

### Prerequisites
1. **Environment Configuration**
   - ✅ `VITE_USE_SUPABASE=true` in `.env`
   - ✅ Supabase project created and schema deployed
   - ✅ Email provider enabled in Supabase Auth dashboard
   - ✅ Test Supabase project URL and anon key configured

2. **Initial Data**
   - Register at least 1 camper user via app
   - Register at least 1 farmer user via app
   - Create 1 admin user (see `supabase/create_admin_user.sql`)
   - Seed 10 test listings (run `supabase/seed_test_listings.sql`)

3. **Test Accounts**
   - Camper: `testcamper@example.com` / `password123`
   - Farmer: `testfarmer@example.com` / `password123`
   - Admin: `admin@wildfarmstays.com` / `admin123` (or your admin credentials)

---

## Test Execution Guidelines

- **Browser Console:** Keep open to monitor for errors
- **Supabase Dashboard:** Monitor table data in real-time
- **Test Isolation:** Clear browser storage between major test sections if needed
- **Data Verification:** Check both UI display AND database records
- **Error Logging:** Document any failures with screenshots/console errors

---

## Test Suites

### Suite 1: Authentication & User Management

#### TEST 1.1: User Registration - Camper
**Priority:** High  
**Prerequisites:** No existing account

**Steps:**
1. Navigate to Registration page
2. Select "Camper" role
3. Fill in: Name, Email (new), Phone, Password, Confirm Password
4. Click "Register"

**Expected Results:**
- ✅ User appears in Supabase `auth.users` table
- ✅ Profile appears in `public.profiles` table with:
  - `role = 'camper'`
  - `first_name`, `last_name`, `email`, `phone` populated
  - `id` matches `auth.users.id`
- ✅ User automatically logged in
- ✅ Dashboard shows camper home screen

**Failure Criteria:**
- User not in `auth.users`
- Profile missing or incomplete
- Login fails after registration

---

#### TEST 1.2: User Registration - Farmer
**Priority:** High  
**Prerequisites:** No existing account

**Steps:**
1. Navigate to Registration page
2. Select "Farmer" role
3. Fill in: All required fields (including farm name, address, postcode, county)
4. Submit form

**Expected Results:**
- ✅ Profile in `public.profiles` has:
  - `role = 'farmer'`
  - `farm_name`, `farm_address`, `postcode`, `county` populated
- ✅ User can navigate to Farmer Dashboard

**Failure Criteria:**
- Farm details missing from profile
- Role incorrect

---

#### TEST 1.3: Login Functionality
**Priority:** Critical

**Steps:**
1. Logout if logged in
2. Navigate to Login page
3. Enter valid email/password
4. Click "Login" button OR press Enter key

**Expected Results:**
- ✅ Both button click AND Enter key trigger login
- ✅ User session established
- ✅ Profile loaded from `public.profiles`
- ✅ Correct role-based dashboard displayed
- ✅ `AuthContext` shows correct user data

**Failure Criteria:**
- Login fails via button or Enter key
- Wrong user data loaded
- Session not persisting

---

#### TEST 1.4: Logout Functionality
**Priority:** Medium

**Steps:**
1. While logged in, click Logout
2. Verify logged out state

**Expected Results:**
- ✅ Session cleared
- ✅ Redirected to Landing page
- ✅ Cannot access protected routes

---

### Suite 2: Listing Management

#### TEST 2.1: Create New Listing (Farmer)
**Priority:** Critical  
**Prerequisites:** Logged in as farmer

**Steps:**
1. Navigate to "Create Listing"
2. Fill in all required fields:
   - Title, Description
   - Price per night: £45
   - Address, Postcode, County (select ROI county like "Cork")
   - Amenities: Select 3-4 options
   - Restrictions: Select 1-2
   - Wildness Rating: 4
   - Max Guests: 4
3. Submit form

**Expected Results:**
- ✅ Listing created in `public.listings` table with:
  - `farmer_id` matches current user
  - `status = 'pending'`
  - `availability = 'pending'`
  - All fields correctly mapped (snake_case in DB)
  - `price_per_night`, `max_guests`, `wildness_rating` stored correctly
  - `amenities` array contains selected values
4. ✅ Farmer sees listing in "Pending Listings" on dashboard
5. ✅ Listing NOT visible to campers (pending status)

**Failure Criteria:**
- Listing not in database
- Field mapping incorrect (camelCase vs snake_case)
- Wrong status/availability

---

#### TEST 2.2: Admin Approve Listing
**Priority:** Critical  
**Prerequisites:** 
- Listing in pending status
- Logged in as admin

**Steps:**
1. Navigate to Admin Dashboard → Listings
2. Find pending listing
3. Click "Approve" button
4. Confirm approval

**Expected Results:**
- ✅ Listing `status = 'approved'` in database
- ✅ Listing `availability = 'available'` in database
- ✅ Admin navigated back to dashboard
- ✅ Listing badge shows "Approved" (not "Pending")
- ✅ Listing now visible to campers in search/listings screens

**Failure Criteria:**
- Status not updated
- Navigation doesn't return to dashboard
- Campers still can't see listing

---

#### TEST 2.3: Admin Reject Listing
**Priority:** Critical  
**Prerequisites:** Pending listing, Admin logged in

**Steps:**
1. Admin Dashboard → Listings
2. Find pending listing
3. Click "Reject"
4. Enter rejection message: "Images need improvement"
5. Submit rejection

**Expected Results:**
- ✅ Listing `status = 'rejected'` in database
- ✅ `rejection_reason` field populated with message
- ✅ Navigation returns to dashboard
- ✅ Listing NOT visible to campers
- ✅ Farmer can see rejection reason (if implemented in farmer view)

**Failure Criteria:**
- Rejection reason not saved
- Listing still visible to campers
- Navigation broken

---

#### TEST 2.4: Edit Listing (Farmer)
**Priority:** High  
**Prerequisites:** Approved listing owned by logged-in farmer

**Steps:**
1. Navigate to "My Listings"
2. Click on an approved listing
3. Edit: Change price from £45 to £50
4. Update description
5. Save changes

**Expected Results:**
- ✅ Changes saved to `public.listings` in Supabase
- ✅ `updated_at` timestamp updated (trigger working)
- ✅ UI reflects new price immediately

**Failure Criteria:**
- Changes not persisted
- `updated_at` not updating

---

#### TEST 2.5: Camper Views Approved Listings
**Priority:** Critical  
**Prerequisites:** At least 1 approved listing exists

**Steps:**
1. Log in as camper
2. Navigate to "Browse Listings" or "Search"
3. View listings

**Expected Results:**
- ✅ ONLY `approved` or `live` listings visible
- ✅ NO `pending` or `rejected` listings shown
- ✅ Listing data displays correctly (price, location, amenities)
- ✅ Field names normalized (camelCase in UI, snake_case in DB handled)

**Failure Criteria:**
- Pending/rejected listings visible
- Data not displaying
- Field mapping errors

---

### Suite 3: Booking Management

#### TEST 3.1: Create Booking with Waiver (Republic of Ireland)
**Priority:** Critical  
**Prerequisites:** 
- Camper logged in
- Approved listing in ROI county (e.g., Cork)

**Steps:**
1. Navigate to approved listing
2. Click "Book Now"
3. Select dates (start: 7 days from now, end: 10 days from now)
4. Enter number of guests
5. Navigate to waiver view (should show Republic of Ireland waiver)
6. Return to booking screen
7. **VERIFY:** Previously entered dates are still there ✅
8. Check "I accept the waiver" checkbox
9. Submit booking

**Expected Results:**
- ✅ Booking created in `public.bookings` with:
  - `camper_id` = current user
  - `farmer_id` = listing owner
  - `listing_id` = selected listing
  - `start_date`, `end_date` correct
  - `total_price` calculated correctly
  - `waiver_accepted = true`
  - `waiver_type = 'republic_ireland'` (based on county)
  - `waiver_accepted_at` timestamp set
  - `waiver_text_snapshot` contains full waiver text
- ✅ Dates persisted when navigating to/from waiver
- ✅ Waiver text has correct apostrophes (no weird characters)

**Failure Criteria:**
- Booking not in database
- Waiver fields missing
- Dates lost on navigation
- Wrong waiver type displayed

---

#### TEST 3.2: Create Booking with Waiver (Northern Ireland)
**Priority:** Critical  
**Prerequisites:** Listing in NI county (e.g., Antrim)

**Steps:**
1. Select listing in Northern Ireland county
2. Navigate to booking flow
3. View waiver - should show Northern Ireland waiver text
4. Complete booking

**Expected Results:**
- ✅ `waiver_type = 'northern_ireland'`
- ✅ Correct waiver text displayed
- ✅ Waiver snapshot stored

---

#### TEST 3.3: Booking Without Waiver Acceptance
**Priority:** High

**Steps:**
1. Complete booking form
2. Do NOT check waiver acceptance
3. Try to submit

**Expected Results:**
- ✅ Submission blocked
- ✅ Error message: "You must accept the waiver"
- ✅ No booking created in database

---

#### TEST 3.4: View Bookings on Home Screen (Camper)
**Priority:** Critical  
**Prerequisites:** At least 1 booking exists for current camper

**Steps:**
1. Log in as camper
2. Navigate to Home screen
3. Check "Upcoming Stays" section

**Expected Results:**
- ✅ Bookings loaded from Supabase (not localStorage)
- ✅ Bookings display correctly with:
  - Listing title
  - Dates
  - Status
- ✅ Both upcoming and recent stays populated if data exists

**Failure Criteria:**
- No bookings shown (but exist in database)
- Data from localStorage instead of Supabase

---

#### TEST 3.5: Admin Booking Management
**Priority:** High  
**Prerequisites:** At least 1 booking exists, Admin logged in

**Steps:**
1. Admin Dashboard → Booking Management
2. View all bookings
3. Filter by status (pending, confirmed, etc.)
4. Search by listing title or camper name
5. Click on booking to view details
6. Confirm a pending booking
7. Cancel another booking

**Expected Results:**
- ✅ All bookings visible to admin
- ✅ Filtering/search working
- ✅ Booking details show:
  - Full camper name (fetched from profiles)
  - Listing title
  - Dates, price
  - Waiver acceptance status
- ✅ Status updates persist to database
- ✅ Navigation returns to booking management after actions

**Failure Criteria:**
- Bookings not loading
- Status updates not saving
- Navigation issues

---

### Suite 4: Reviews & Ratings

#### TEST 4.1: Create Review (Camper)
**Priority:** High  
**Prerequisites:** Completed booking for camper

**Steps:**
1. Log in as camper
2. Navigate to completed booking or listing
3. Click "Write Review"
4. Enter:
   - Rating: 5
   - Title: "Amazing stay!"
   - Comment: "We loved it here..."
5. Submit

**Expected Results:**
- ✅ Review created in `public.reviews`:
  - `reviewer_id` = current user
  - `listing_id` = correct listing
  - `rating`, `title`, `comment` stored
  - `approved = false` (default, or true if auto-approved)
- ✅ Review appears in Reviews screen
- ✅ Listing review count updated (if implemented)

**Failure Criteria:**
- Review not saved
- Field mapping incorrect
- Review not displaying

---

#### TEST 4.2: View Reviews on Listing
**Priority:** Medium  
**Prerequisites:** Listing with reviews

**Steps:**
1. View listing with reviews
2. Navigate to Reviews section
3. Check review display

**Expected Results:**
- ✅ Reviews fetched from Supabase
- ✅ Reviewer names fetched from `profiles` table
- ✅ Only approved reviews visible (if moderation enabled)
- ✅ Statistics (average rating, review count) correct

---

#### TEST 4.3: Farmer Rate Camper
**Priority:** Medium  
**Prerequisites:** Completed booking, Farmer logged in

**Steps:**
1. Navigate to Farmer Rating screen
2. Find booking to rate
3. Submit rating (1-5) and optional comment

**Expected Results:**
- ✅ Rating stored in `public.farmer_ratings`:
  - `farmer_id` = current user
  - `reviewer_id` = camper from booking
  - Rating and comment stored

**Failure Criteria:**
- Rating not saved
- Wrong user IDs mapped

---

### Suite 5: Messaging

#### TEST 5.1: Send Message
**Priority:** High  
**Prerequisites:** 
- Camper and Farmer both logged in
- At least 1 listing exists

**Steps:**
1. Log in as camper
2. Navigate to a listing
3. Click "Message Farmer" or navigate to Messages
4. Select/create conversation with farmer
5. Send message: "Hi, is this available next week?"

**Expected Results:**
- ✅ Message created in `public.messages`:
  - `sender_id` = camper
  - `receiver_id` = farmer
  - `message_text` = sent text
  - `read = false`
  - `conversation_id` generated (check format - may be string or UUID)
- ✅ Message appears in conversation thread
- ✅ Farmer sees unread count increment

**Failure Criteria:**
- Message not in database
- Conversation ID format issues (UUID vs string)
- Unread count not updating

---

#### TEST 5.2: View Conversations
**Priority:** High

**Steps:**
1. Navigate to Messages screen
2. View conversations list

**Expected Results:**
- ✅ Conversations loaded from Supabase
- ✅ Last message preview correct
- ✅ Unread count accurate
- ✅ Other user names fetched from `profiles` table
- ✅ Conversations sorted by last message time

**Failure Criteria:**
- Conversations not loading
- Wrong names displayed
- Sorting broken

---

#### TEST 5.3: Mark Messages as Read
**Priority:** Medium

**Steps:**
1. Open conversation with unread messages
2. View messages

**Expected Results:**
- ✅ Unread messages automatically marked `read = true`
- ✅ Unread count decreases
- ✅ Changes persisted to database

---

### Suite 6: Favorites

#### TEST 6.1: Add to Favorites
**Priority:** Medium  
**Prerequisites:** Camper logged in, Approved listing exists

**Steps:**
1. View listing details
2. Click "Add to Favorites" (heart icon)
3. Navigate to Favorites section

**Expected Results:**
- ✅ Favorite created in `public.favorites`:
  - `camper_id` = current user
  - `listing_id` = selected listing
- ✅ Listing appears in Favorites list
- ✅ Full listing details displayed

**Failure Criteria:**
- Favorite not saved
- Listing details missing from favorites view

---

#### TEST 6.2: Remove from Favorites
**Priority:** Medium

**Steps:**
1. From favorites list, click to remove
2. Verify removal

**Expected Results:**
- ✅ Favorite deleted from database
- ✅ Listing removed from favorites list

---

### Suite 7: Support Tickets

#### TEST 7.1: Create Support Ticket (Contact Us)
**Priority:** High

**Steps:**
1. Navigate to Contact Us page
2. Fill in form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Subject: "Question about booking"
   - Message: "I need help with..."
3. Submit

**Expected Results:**
- ✅ Ticket created in `public.support_tickets`:
  - `name`, `email`, `subject`, `message` populated
  - `status = 'open'`
  - `user_id` = current user if logged in, NULL if guest
- ✅ Success message displayed
- ✅ Form cleared

**Failure Criteria:**
- Ticket not in database
- Data missing

---

#### TEST 7.2: Admin View Support Tickets
**Priority:** High  
**Prerequisites:** At least 1 ticket exists, Admin logged in

**Steps:**
1. Admin Dashboard → Support Tickets
2. View tickets list
3. Search/filter tickets
4. Click on ticket to view details
5. Update status (e.g., open → in-progress → resolved)

**Expected Results:**
- ✅ All tickets visible to admin
- ✅ Search/filter working
- ✅ Ticket details complete:
  - User name, email
  - Subject, message
  - Status, created date
- ✅ Status updates persisted
- ✅ Admin can add notes (if implemented)

**Failure Criteria:**
- Tickets not loading
- Status updates not saving

---

### Suite 8: Admin User Management

#### TEST 8.1: View All Users
**Priority:** High  
**Prerequisites:** Multiple users registered, Admin logged in

**Steps:**
1. Admin Dashboard → User Management
2. View users list
3. Filter by role (Camper, Farmer)
4. Search by name/email

**Expected Results:**
- ✅ All users loaded from `public.profiles`
- ✅ Users correctly displayed with:
  - Name (first_name + last_name)
  - Email
  - Role badge
  - Verification status
- ✅ Admin users filtered out (not shown in list)
- ✅ Search and filter working

**Failure Criteria:**
- Users not loading
- Field mapping incorrect (snake_case vs camelCase)
- Admin users showing in list

---

#### TEST 8.2: View User Details
**Priority:** High

**Steps:**
1. Click on user from User Management
2. View User Details screen

**Expected Results:**
- ✅ User profile data displayed:
  - Name, email, phone
  - Role, verification status
  - Farm details (if farmer)
  - Join date
- ✅ Statistics:
  - Total bookings
  - Total listings (if farmer)
  - Total reviews
  - Completed bookings
- ✅ Recent bookings/listings displayed
- ✅ Data loaded from Supabase (not localStorage)

**Failure Criteria:**
- Data not loading
- Statistics incorrect
- Wrong data source

---

### Suite 9: Data Integrity & Field Mapping

#### TEST 9.1: Verify Field Name Mapping
**Priority:** Critical

**Steps:**
1. Create/update records in each major table
2. Check database records directly in Supabase Dashboard
3. Verify UI displays correct data

**Expected Results:**
- ✅ **Listings:** 
  - DB: `farmer_id`, `price_per_night`, `max_guests`, `wildness_rating`
  - UI: `farmerId`, `pricePerNight`, `maxGuests`, `wildnessRating`
- ✅ **Bookings:**
  - DB: `camper_id`, `farmer_id`, `start_date`, `end_date`, `total_price`, `special_requests`
  - UI: `camperId`, `farmerId`, `startDate`, `endDate`, `totalPrice`, `specialRequests`
- ✅ **Reviews:**
  - DB: `reviewer_id`, `listing_id`, `title`, `approved`
  - UI: `reviewerId`, `listingId`, `title`, `approved`
- ✅ **Messages:**
  - DB: `sender_id`, `receiver_id`, `message_text`, `conversation_id`
  - UI: `senderId`, `receiverId`, `content`, `conversationId`
- ✅ **Profiles:**
  - DB: `first_name`, `last_name`, `farm_name`, `join_date`
  - UI: `firstName`, `lastName`, `farmName`, `joinDate`

**Failure Criteria:**
- Field mismatches causing data loss
- UI showing NULL/undefined values

---

#### TEST 9.2: Verify Timestamps and Triggers
**Priority:** Medium

**Steps:**
1. Create new listing
2. Update listing
3. Check `created_at` and `updated_at` in database

**Expected Results:**
- ✅ `created_at` set on insert
- ✅ `updated_at` updated on modification (trigger working)
- ✅ Applies to: listings, bookings, reviews, profiles, support_tickets

---

### Suite 10: Row Level Security (RLS)

#### TEST 10.1: Camper Can Only See Own Data
**Priority:** Critical

**Steps:**
1. Log in as Camper A
2. Create booking, review, favorite
3. Log in as Camper B
4. Try to access Camper A's data via UI

**Expected Results:**
- ✅ Camper B cannot see Camper A's:
  - Bookings
  - Messages
  - Favorites
  - Reviews (except approved public ones)
- ✅ RLS policies preventing unauthorized access
- ✅ No 403/401 errors (handled gracefully)

**Test via Direct API Calls:**
- Try to query `bookings` where `camper_id != auth.uid()` → Should return empty or error
- Try to query `favorites` where `camper_id != auth.uid()` → Should return empty

---

#### TEST 10.2: Farmer Can Only Manage Own Listings
**Priority:** Critical

**Steps:**
1. Log in as Farmer A
2. View listings, bookings
3. Log in as Farmer B
4. Try to edit Farmer A's listings via UI

**Expected Results:**
- ✅ Farmer B cannot edit Farmer A's listings
- ✅ RLS blocks updates where `farmer_id != auth.uid()`
- ✅ UI prevents access (or shows read-only)

---

#### TEST 10.3: Admin Can See All Data
**Priority:** Critical

**Steps:**
1. Log in as Admin
2. View listings, bookings, users, tickets

**Expected Results:**
- ✅ Admin sees ALL listings (pending, approved, rejected)
- ✅ Admin sees ALL bookings
- ✅ Admin sees ALL users
- ✅ Admin sees ALL support tickets
- ✅ RLS policies allow admin access

---

#### TEST 10.4: Public Read-Only Access
**Priority:** Medium

**Steps:**
1. Logout (or use incognito)
2. View public pages (Listings, Search)

**Expected Results:**
- ✅ Can view approved/live listings
- ✅ Cannot create bookings (must login)
- ✅ Cannot create reviews
- ✅ RLS allows public SELECT for approved listings only

---

### Suite 11: Edge Cases & Error Handling

#### TEST 11.1: Invalid Data Submission
**Priority:** Medium

**Steps:**
1. Try to create booking with:
   - End date before start date
   - Start date in the past
   - Invalid guest count (negative, 0, >max)
2. Submit

**Expected Results:**
- ✅ Validation errors displayed
- ✅ No invalid data saved to database
- ✅ User-friendly error messages

---

#### TEST 11.2: Network/Connection Errors
**Priority:** Medium

**Steps:**
1. Disconnect internet
2. Try to create booking/review
3. Reconnect
4. Verify data sync

**Expected Results:**
- ✅ Error messages displayed gracefully
- ✅ No app crashes
- ✅ Data syncs when connection restored (if retry logic exists)

---

#### TEST 11.3: Duplicate Constraints
**Priority:** Medium

**Steps:**
1. Try to favorite same listing twice
2. Try to review same listing twice

**Expected Results:**
- ✅ Duplicate favorites prevented (`UNIQUE(camper_id, listing_id)`)
- ✅ Duplicate reviews prevented (`UNIQUE(listing_id, reviewer_id)`)
- ✅ Error handled gracefully

---

### Suite 12: Feature Flag Behavior

#### TEST 12.1: Supabase Enabled
**Priority:** Critical

**Steps:**
1. Ensure `VITE_USE_SUPABASE=true`
2. Restart dev server
3. Perform data operations (create booking, listing, etc.)
4. Check Supabase Dashboard

**Expected Results:**
- ✅ All data operations go to Supabase
- ✅ No data in browser localStorage (for app data)
- ✅ Console shows Supabase API calls

---

#### TEST 12.2: localStorage Fallback (Optional)
**Priority:** Low (if testing fallback)

**Steps:**
1. Set `VITE_USE_SUPABASE=false`
2. Restart dev server
3. Perform data operations

**Expected Results:**
- ✅ App uses localStorage
- ✅ No Supabase API calls in console
- ✅ App still functional (for development/testing)

---

## Regression Tests

These should be verified as part of the full test run:

1. ✅ **Scroll to Top:** Navigate between public pages → Page scrolls to top
2. ✅ **Login Enter Key:** Press Enter on password field → Login triggered
3. ✅ **Waiver Snapshot:** Check booking in database → `waiver_text_snapshot` populated
4. ✅ **Admin Navigation:** Approve/reject listing → Returns to dashboard
5. ✅ **Amenities List:** Create listing → Correct amenities options shown (not wrong list)
6. ✅ **Price Default:** Create listing → Price defaults to £0 (not £25)
7. ✅ **Home Screen Data:** View camper home → Uses Supabase bookings

---

## Performance Tests

#### TEST P.1: List Loading Performance
**Priority:** Medium

**Steps:**
1. Seed 50+ listings
2. Navigate to Listings screen
3. Measure load time
4. Apply filters
5. Measure filter time

**Expected Results:**
- ✅ Initial load < 2 seconds
- ✅ Filters apply < 500ms
- ✅ No visible lag in UI

---

#### TEST P.2: Search Performance
**Priority:** Low

**Steps:**
1. Search with various queries
2. Measure response time

**Expected Results:**
- ✅ Search results load < 1 second

---

## Final Verification Checklist

Before marking migration complete, verify:

- [ ] All critical tests passing (TEST 1.1 - 3.4)
- [ ] All data operations saving to Supabase
- [ ] No console errors during normal usage
- [ ] RLS policies working correctly
- [ ] Field mapping verified (snake_case ↔ camelCase)
- [ ] All major user flows working:
  - [ ] Camper: Register → Browse → Book → Review
  - [ ] Farmer: Register → Create Listing → Manage Bookings
  - [ ] Admin: Approve Listings → Manage Bookings → View Users → Manage Tickets
- [ ] Waiver system functional (ROI vs NI)
- [ ] Navigation working correctly
- [ ] Data persists across page refreshes

---

## Known Issues / TODO

Document any issues found during testing:

1. **Issue:** [Description]
   - **Severity:** High/Medium/Low
   - **Steps to Reproduce:** 
   - **Expected:** 
   - **Actual:** 
   - **Status:** Open/Fixed/Deferred

---

## Test Sign-Off

**Tester Name:** _________________  
**Date:** _________________  
**Environment:** Development / Staging / Production  
**Overall Status:** ✅ Pass / ❌ Fail / ⚠️ Pass with Issues

**Notes:**
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

---

**Next Steps After Testing:**
1. Fix any critical/high priority issues
2. Document medium/low priority issues for backlog
3. Performance optimization if needed
4. Deploy to staging/production after all tests pass


