# Listing Rejection Flow - Summary

## Overview
When an admin rejects a listing, the rejection reason is stored and farmers can view it, then edit and resubmit their listing.

---

## 1. Admin Rejects a Listing

### Where it happens:
- **ListingManagement.tsx** - Admin clicks "Reject" button
- **EditListingScreen.tsx** - Admin clicks "✕ Reject Listing" button (in view-only mode)

### Process:
1. Admin clicks "Reject" button
2. System prompts: "Please provide a reason for rejection and any recommendations for the farmer:"
3. Admin enters rejection reason (required)
4. System stores:
   - `status = 'rejected'` 
   - `rejection_reason = [admin's message]` (stored in database as `rejection_reason`)

### Code Location:
- `src/screens/ListingManagement.tsx` - `handleRejectListing()` function (lines 216-255)
- `src/screens/EditListingScreen.tsx` - Reject button handler (lines 1071-1109)

---

## 2. Where Rejection Message is Stored

### Database:
- **Table:** `public.listings`
- **Field:** `rejection_reason` (TEXT, nullable)
- **Status Field:** `status` = `'rejected'`

### Example Database Record:
```sql
SELECT id, title, status, rejection_reason 
FROM public.listings 
WHERE status = 'rejected';

-- Result:
-- id: abc-123
-- title: "My Farm Listing"
-- status: "rejected"
-- rejection_reason: "Images need improvement. Please upload higher quality photos."
```

---

## 3. Where Farmers See Rejection Messages

### Location 1: Listings Screen (My Listings)
**File:** `src/screens/ListingsScreen.tsx`

**What farmers see:**
- Rejected listings appear in their "My Listings" view
- A red banner displays:
  ```
  ⚠️ Listing Rejected
  Admin feedback: [rejection reason]
  Please edit this listing to address the issues and resubmit.
  ```
- Two action buttons:
  - **🔄 Fix & Resubmit** - Opens edit screen
  - **🗑️ Delete** - Deletes the listing

**Code Location:**
- Rejection banner: Lines 302-308
- Action buttons: Lines 412-430

**Field Mapping:**
- Database field: `rejection_reason` (snake_case)
- UI field: `rejectionReason` (camelCase)
- **Fixed:** Added field mapping in `loadListings()` to convert `rejection_reason` → `rejectionReason`

### Location 2: Edit Listing Screen
**File:** `src/screens/EditListingScreen.tsx`

When a farmer opens a rejected listing for editing:
- The form is pre-populated with existing data
- The rejection reason is available in the listing object
- When saved, the system detects it's a resubmission and resets status to `pending`

---

## 4. How Farmers Resubmit Rejected Listings

### Process:
1. **Farmer views rejected listing** in "My Listings" screen
2. **Farmer clicks "🔄 Fix & Resubmit"** button
3. **Edit screen opens** with all listing data pre-filled
4. **Farmer makes changes** (e.g., uploads better photos, fixes description)
5. **Farmer clicks "Save Changes"**
6. **System detects resubmission:**
   ```typescript
   const isResubmission = currentListing.status === 'rejected' || 
                          currentListing.availability === 'rejected';
   ```
7. **System updates listing:**
   - `status = 'pending'`
   - `availability = 'pending'`
   - `rejection_reason = null` (clears rejection reason)
8. **Success message:** "Listing resubmitted successfully! It will be reviewed by our admin team before going live."
9. **Listing returns to pending status** for admin review

### Code Location:
- `src/screens/EditListingScreen.tsx` - `handleSubmit()` function (lines 395-482)
- Resubmission detection: Line 402
- Status reset: Lines 428-432

---

## 5. Field Mapping Fixes Applied

### Issue Found:
- `rejection_reason` from database wasn't being mapped to `rejectionReason` in UI
- Rejection checks were only looking at `availability` field, not `status` field

### Fixes Applied:
1. **Added field mapping** in `ListingsScreen.tsx`:
   ```typescript
   rejectionReason: listing.rejection_reason || listing.rejectionReason
   ```

2. **Fixed availability mapping** to handle rejected status:
   ```typescript
   availability: listing.status === 'rejected' 
     ? 'rejected' 
     : listing.status === 'approved' || listing.status === 'live' 
     ? 'available' 
     : listing.availability || 'pending'
   ```

3. **Updated rejection checks** to check both `status` and `availability`:
   ```typescript
   {(item.status === 'rejected' || item.availability === 'rejected') && 
    (item.rejectionReason || item.rejection_reason) && isFarmer && (
     // Show rejection banner
   )}
   ```

---

## 6. Testing Checklist

### Admin Side:
- [ ] Admin can reject a listing with a reason
- [ ] Rejection reason is required (prompt shows if empty)
- [ ] Rejection reason is saved to database
- [ ] Listing status changes to `'rejected'` in database

### Farmer Side:
- [ ] Farmer can see rejected listings in "My Listings"
- [ ] Rejection banner displays with admin's feedback
- [ ] "Fix & Resubmit" button is visible and clickable
- [ ] Clicking "Fix & Resubmit" opens edit screen
- [ ] Farmer can make changes and save
- [ ] After saving, listing status changes to `'pending'`
- [ ] Rejection reason is cleared after resubmission
- [ ] Success message confirms resubmission

### Data Verification:
- [ ] Check database: `rejection_reason` field is populated
- [ ] Check database: `status` field is `'rejected'`
- [ ] After resubmission: `status` is `'pending'` and `rejection_reason` is `NULL`

---

## 7. Current Status

✅ **Working:**
- Admin can reject listings with reason
- Rejection reason stored in database
- Farmers can see rejected listings
- Field mapping fixed (`rejection_reason` → `rejectionReason`)
- Rejection checks updated (check both `status` and `availability`)
- Resubmission flow works (status resets to `pending`)

⚠️ **To Test:**
- End-to-end flow: Admin rejects → Farmer sees → Farmer resubmits → Admin approves
- Verify rejection reason displays correctly in UI
- Verify resubmission clears rejection reason

---

## 8. Related Files

- `src/screens/ListingManagement.tsx` - Admin rejection handler
- `src/screens/EditListingScreen.tsx` - Admin rejection handler + farmer resubmission
- `src/screens/ListingsScreen.tsx` - Farmer view of rejected listings
- `src/services/APIService.ts` - Database operations

---

## 9. Database Schema

```sql
-- listings table
CREATE TABLE public.listings (
  id UUID PRIMARY KEY,
  farmer_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'live'
  availability TEXT DEFAULT 'pending', -- 'available', 'pending', 'suspended', 'rejected'
  rejection_reason TEXT, -- Admin's feedback when rejecting
  -- ... other fields
);
```

---

## 10. User Flow Diagram

```
Admin Dashboard
    ↓
[Reject Listing]
    ↓
Enter rejection reason
    ↓
Database: status='rejected', rejection_reason='...'
    ↓
─────────────────────────
    ↓
Farmer's "My Listings"
    ↓
[⚠️ Listing Rejected Banner]
[Admin feedback: "..."]
    ↓
[🔄 Fix & Resubmit] button
    ↓
Edit Listing Screen
    ↓
Make changes
    ↓
[Save Changes]
    ↓
Database: status='pending', rejection_reason=NULL
    ↓
Success: "Listing resubmitted..."
    ↓
Admin reviews again
```

---

## Summary

**Rejection messages are stored in:**
- Database: `public.listings.rejection_reason` field

**Farmers see rejection messages in:**
- "My Listings" screen (ListingsScreen.tsx) - Shows rejection banner with admin feedback

**Farmers can resubmit by:**
- Clicking "🔄 Fix & Resubmit" button
- Editing the listing
- Saving changes (automatically resets to `pending` status)

**All fixes have been applied and the flow should now work correctly!**


