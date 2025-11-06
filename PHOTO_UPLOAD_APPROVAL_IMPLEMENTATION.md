# Photo Upload Approval Implementation

## Overview
Photo upload approval is now requested only once per listing/review, and the approval is stored in the database with a timestamp.

---

## Database Changes

### 1. Listings Table
**File:** `supabase/add_photo_upload_approval.sql`

Added field:
- `photo_upload_approved_at TIMESTAMP` - Records when farmer first approved photo upload access for a listing

**Run this migration:**
```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS photo_upload_approved_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_listings_photo_approval 
ON public.listings(photo_upload_approved_at) 
WHERE photo_upload_approved_at IS NOT NULL;
```

### 2. Reviews Table
**File:** `supabase/add_review_photo_approval.sql`

Added field:
- `photo_upload_approved_at TIMESTAMP` - Records when camper first approved photo upload access for a review

**Run this migration:**
```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS photo_upload_approved_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_reviews_photo_approval 
ON public.reviews(photo_upload_approved_at) 
WHERE photo_upload_approved_at IS NOT NULL;
```

---

## Implementation Details

### For Listings (EditListingScreen.tsx)

**How it works:**
1. When listing loads, check `photo_upload_approved_at` field
2. If `null` → Approval not given yet
3. If timestamp exists → Approval already given

**Flow:**
- **First photo upload:**
  1. User clicks "+ Add Photo"
  2. Modal appears asking for approval
  3. User clicks "Continue"
  4. Approval timestamp saved to database (`photo_upload_approved_at`)
  5. File picker opens
  6. Image uploaded

- **Subsequent photo uploads:**
  1. User clicks "+ Add Photo"
  2. File picker opens immediately (no modal)
  3. Image uploaded

**Code Location:**
- Approval check: `useEffect` hook (line ~91)
- Approval save: `handleConfirmImageUpload` (line ~345-356)
- Skip modal: `handleAddImage` (line ~330-336)

---

### For Reviews (ReviewScreen.tsx)

**How it works:**
1. Check if `images.length > 0` (if images exist, approval was given)
2. Track approval in state (`photoUploadApproved`)
3. When review is submitted with images, save approval timestamp to database

**Flow:**
- **First photo upload:**
  1. User clicks "+ Add Photo"
  2. Modal appears asking for approval
  3. User clicks "Continue"
  4. Approval marked in state (`photoUploadApproved = true`)
  5. File picker opens
  6. Image uploaded

- **Subsequent photo uploads:**
  1. User clicks "+ Add Photo"
  2. File picker opens immediately (no modal)
  3. Image uploaded

- **When review is submitted:**
  - If `images.length > 0`, `photo_upload_approved_at` timestamp is saved to database

**Code Location:**
- Approval check: `useEffect` hook (line ~41-45)
- Approval save: `handleSubmitReview` (line ~192)
- Skip modal: `handleAddImage` (line ~75-81)

---

## Database Records

### Listings
```sql
SELECT id, title, photo_upload_approved_at 
FROM public.listings 
WHERE photo_upload_approved_at IS NOT NULL;
```

**Example:**
```
id: abc-123-def
title: "Green Valley Farm"
photo_upload_approved_at: "2024-01-15 14:30:00"
```

### Reviews
```sql
SELECT id, listing_id, reviewer_id, photo_upload_approved_at, images
FROM public.reviews 
WHERE photo_upload_approved_at IS NOT NULL;
```

**Example:**
```
id: xyz-789-ghi
listing_id: abc-123-def
reviewer_id: user-456
photo_upload_approved_at: "2024-01-20 10:15:00"
images: ["https://storage.../image1.jpg", "https://storage.../image2.jpg"]
```

---

## User Experience

### Farmer Editing Listing
1. **First time adding photo:**
   - Clicks "+ Add Photo"
   - Sees approval modal: "This will open your file browser to select a photo for your farm listing."
   - Clicks "Continue"
   - File picker opens
   - Selects and uploads photo

2. **Adding more photos:**
   - Clicks "+ Add Photo"
   - File picker opens immediately (no modal)
   - Selects and uploads photo

### Camper Adding Review Photos
1. **First time adding photo:**
   - Clicks "+ Add Photo"
   - Sees approval modal: "This will open your file browser to select a photo for your review."
   - Clicks "Continue"
   - File picker opens
   - Selects and uploads photo

2. **Adding more photos:**
   - Clicks "+ Add Photo"
   - File picker opens immediately (no modal)
   - Selects and uploads photo

3. **When review is submitted:**
   - If photos were uploaded, `photo_upload_approved_at` is saved to database

---

## Testing Checklist

### Listings
- [ ] Create new listing → Add first photo → Modal appears
- [ ] Approve and upload first photo → Check database: `photo_upload_approved_at` is set
- [ ] Add second photo → No modal, file picker opens directly
- [ ] Edit existing listing with approval → No modal on photo add
- [ ] Edit existing listing without approval → Modal appears on first photo add

### Reviews
- [ ] Start new review → Add first photo → Modal appears
- [ ] Approve and upload first photo → `photoUploadApproved` state is true
- [ ] Add second photo → No modal, file picker opens directly
- [ ] Submit review with photos → Check database: `photo_upload_approved_at` is set
- [ ] Submit review without photos → Check database: `photo_upload_approved_at` is NULL

---

## Files Modified

1. **Database Migrations:**
   - `supabase/add_photo_upload_approval.sql` (NEW)
   - `supabase/add_review_photo_approval.sql` (NEW)

2. **Components:**
   - `src/components/ImageUploadConfirmationModal.tsx` (NEW)

3. **Screens:**
   - `src/screens/EditListingScreen.tsx`
   - `src/screens/ReviewScreen.tsx`

4. **Services:**
   - `src/services/ReviewService.ts`

---

## Next Steps

1. **Run database migrations:**
   - Execute `supabase/add_photo_upload_approval.sql` in Supabase SQL Editor
   - Execute `supabase/add_review_photo_approval.sql` in Supabase SQL Editor

2. **Test the flow:**
   - Test as farmer adding photos to listing
   - Test as camper adding photos to review
   - Verify database records are created

3. **Verify:**
   - Approval modal only shows once per listing/review
   - Database timestamps are saved correctly
   - Subsequent photo uploads skip the modal

---

## Notes

- **User Activation Context:** The modal uses React Native `Modal` component which preserves user activation context, allowing the file picker to open immediately after clicking "Continue"
- **State Management:** For reviews, approval is tracked in component state until the review is submitted, then saved to database
- **Database Persistence:** For listings, approval is saved immediately to database when first given
- **Backward Compatibility:** Existing listings/reviews without approval timestamps will show the modal on first photo add

