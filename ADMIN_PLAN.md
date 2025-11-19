# Admin Functionality Plan for WildFarmStays

## Overview
This document outlines the complete plan for implementing admin/support functionality to manage the WildFarmStays platform, including user management, listings, bookings, disputes, and support tasks.

---

## 1. Admin Role & Authentication

### 1.1 Admin User Type
Add new user role to existing system:
```typescript
type UserRole = 'camper' | 'farmer' | 'admin';
```

### 1.2 Admin Authentication
- Same login system as regular users
- Special admin flag in user profile
- Can impersonate other users (for support)
- Activity logging for security

### 1.3 Admin Access Levels (Future Expansion)
```
Super Admin (Level 3):
- Full system access
- Can create/delete admins
- Access to all financial data

Admin (Level 2):
- User management
- Content moderation
- Booking management
- Basic analytics

Support (Level 1):
- View user accounts
- Manage bookings
- Handle support tickets
- No user deletion
```

---

## 2. Admin Dashboard (Home Screen)

### 2.1 Overview Cards
Display at a glance:
- **Total Users** (with breakdown: Campers vs Farmers)
- **Active Listings** (approved vs pending)
- **Open Bookings** (today, this week, this month)
- **Pending Issues** (disputes, reported content, support tickets)
- **Revenue** (total, this month, fees collected)
- **New Registrations** (last 7 days, last 30 days)

### 2.2 Quick Actions
- Approve pending listings
- View recent bookings
- Respond to support tickets
- Review flagged content
- Manage disputes

### 2.3 Activity Feed
- Recent user registrations
- New listings posted
- Completed bookings
- Cancelled bookings
- Reported issues
- System alerts

### 2.4 Alert/Notification System
- High-priority issues requiring attention
- Booking conflicts
- Payment disputes
- User complaints
- System errors

---

## 3. User Management

### 3.1 User List View
Columns to display:
- Name
- Email
- Role (Badge: Camper/Farmer)
- Join Date
- Status (Active/Suspended/Verified)
- Subscription Status
- Last Activity
- Actions dropdown

### 3.2 Search & Filters
- Search by: Name, Email, User ID
- Filter by: Role, Status, Subscription, Join Date
- Sort by: Recent activity, Alphabetical, Join date

### 3.3 User Details View
When clicking on a user:
- **Profile Information**
  - Full name, email, phone
  - Profile picture
  - Bio/description
- **Account Status**
  - Verified status
  - Subscription details
  - Payment history
  - Account creation date
- **Activity Statistics**
  - Number of bookings made
  - Number of listings (if farmer)
  - Total reviews given/received
  - Completed stays
- **Financial Overview** (if farmer)
  - Total earnings
  - Pending payments
  - Commission breakdown
- **Actions Available**
  - View bookings
  - View listings (if farmer)
  - View messages
  - View reviews
  - Suspend account
  - Delete account
  - Reset password
  - Add notes (internal admin notes)

### 3.4 User Actions

#### Suspend Account
- Reason selector (dropdown)
- Duration (temporary vs permanent)
- Email notification to user
- Account locked, cannot login
- Existing bookings managed (refund/cancel)

#### Delete Account
- Warning confirmation
- Data retention policy (30 days)
- Email notification
- Backup account data

#### Reset Password
- Generate new password
- Send to user email
- Force password change on next login

#### Impersonate User (Support Mode)
- Log in as that user
- Full access to their account
- Leave notes for why impersonated
- Audit trail maintained
- Cannot make purchases

---

## 4. Listing Management

### 4.1 Listings Overview
Table columns:
- Listing Title
- Farmer Name
- Location
- Price
- Status (Active/Pending/Suspended)
- Approval Date
- Last Updated
- Actions

### 4.2 Filters
- Status: All / Pending Approval / Active / Suspended
- Location
- Price range
- Created date range
- Report flags

### 4.3 Listing Approval Process

#### Pending Listings Queue
- Review submitted listings
- View all listing details
- Images preview
- Map location check
- Verify farmer identity
- Approve or Reject with reason

#### Listing Actions
- **Approve**
  - Goes live immediately
  - Notify farmer
  - Optional featured placement
- **Request Changes**
  - List what needs changing
  - Email farmer with details
  - Listing remains in "revision" status
- **Reject**
  - Provide reason
  - Email farmer
  - Listing not published
- **Suspend**
  - Immediate removal from public view
  - Notify farmer
  - Reason required
  - Can reinstate later
- **Delete**
  - Permanent removal
  - Existing bookings become "cancelled"
  - Refund handling

### 4.4 Edit Listing (Admin Override)
- Can modify any listing details
- Save changes with notification to farmer
- Log all changes for audit

### 4.5 Reported Listings
- View listing reports
- Review reported content
- Take action: Remove content / Dismiss report / Contact farmer
- Keep record of all moderation actions

---

## 5. Booking Management

### 5.1 Bookings List
Table columns:
- Booking ID
- Listing Name
- Camper Name
- Farmer Name
- Dates (Check-in / Check-out)
- Status (Pending/Confirmed/Completed/Cancelled)
- Total Price
- Commission
- Booking Date
- Actions

### 5.2 Search & Filters
- By booking ID
- By camper/farmer name
- By listing
- By date range
- By status
- By payment status

### 5.3 Booking Details View
When clicking on a booking:
- **Booking Information**
  - Reference number
  - Dates and duration
  - Number of guests
  - Special requests
  - Total price
- **Parties Involved**
  - Camper details (with link to profile)
  - Farmer details (with link to profile)
  - Listing details (with link)
- **Financial Details**
  - Platform fee
  - Farmer earnings
  - Payment status
  - Payment date
- **Communication**
  - View message history between parties
  - Send message (as platform admin)
- **Actions Available**
  - Confirm booking
  - Cancel booking (with refund)
  - Issue refund
  - Change booking dates
  - View reviews post-stay
  - Add internal notes

### 5.4 Booking Actions

#### Confirm Booking
- Manually override and confirm
- Useful for special circumstances
- Notify both parties
- Mark as "Admin Approved"

#### Cancel Booking
- Select reason (dropdown)
- Determine refund amount
- Issue refund to camper
- Release dates for rebooking
- Notify both parties
- Email confirmations sent

#### Issue Refund
- Full or partial refund
- Reason required
- Payment method recorded
- Update booking status
- Update financial records

#### Modify Booking
- Change dates (if available)
- Change number of guests
- Update price if needed
- Notify both parties

### 5.5 Booking Disputes
- View disputes between users
- Communication history
- Evidence submitted
- Resolve disputes
- Make refund decisions
- Assign compensation
- Close dispute with resolution notes

---

## 6. Message Management & Support

### 6.1 Support Tickets
New feature to add:
- Users can create support tickets from help page
- Categories: Booking Issue, Payment Issue, Account Issue, Technical Issue, Other
- Priority levels
- Status: Open / In Progress / Resolved / Closed

### 6.2 Ticket List
- Ticket ID
- User
- Subject
- Category
- Priority
- Status
- Created Date
- Last Updated
- Assigned Admin

### 6.3 Ticket Details
- Full conversation history
- User details
- Related booking/listing
- Status and priority
- Assign to admin
- Add internal notes (not visible to user)
- Mark as resolved
- Add to knowledge base

### 6.4 Communication Monitor
- View all platform messages (for moderation)
- Flag inappropriate content
- Intervene in conversations if needed
- Send warning messages
- Archive conversations

---

## 7. Review & Rating Management

### 7.1 Reviews Overview
- All submitted reviews
- Flagged reviews
- Pending moderation
- Average ratings by listing

### 7.2 Review Actions
- **Approve/Remove** reviews
- **Edit** review content if inappropriate
- **Hide** review from public view
- **Contact** reviewer about review
- **Remove** fake or malicious reviews

### 7.3 Review Reports
- View reported reviews
- Investigate claims
- Remove if violation found
- Ignore if false report

---

## 8. Financial Overview

### 8.1 Revenue Dashboard
- Total platform earnings
- Commission breakdown
- Monthly/yearly trends
- Payment processing status
- Outstanding payments

### 8.2 Payment Management
- View all transactions
- Process refunds
- Handle payment disputes
- Pay farmers (if needed manually)
- Export financial reports

### 8.3 Reports
- Generate revenue reports
- User growth reports
- Popular listings
- Booking trends
- Geographic distribution

---

## 9. Analytics & Reporting

### 9.1 Key Metrics
- User growth (daily/weekly/monthly)
- Active listings count
- Booking conversion rate
- Average booking value
- Repeat customer rate
- Farmer earnings
- Platform revenue

### 9.2 Charts & Visualizations
- User registration trends
- Booking volume over time
- Revenue charts
- Geographic heat map of bookings
- Popular locations
- Seasonal trends

### 9.3 Export Options
- CSV export for all data
- PDF reports
- Excel spreadsheets
- Scheduled reports

---

## 10. Content Moderation

### 10.1 Reported Content
- Listings reported as inappropriate
- User profiles reported
- Review reports
- Message reports
- Automated flagging

### 10.2 Moderation Actions
- Review flagged content
- Remove inappropriate content
- Issue warnings
- Escalate to higher authorities (if needed)
- Track moderation history

### 10.3 Blacklist Management
- Manage blocked words/phrases
- IP blocking
- Device blocking
- Country restrictions

---

## 11. System Settings

### 11.1 Platform Settings
- Commission rates
- Payment thresholds
- Fee structures
- Subscription pricing
- Feature toggles

### 11.2 Email Templates
- Edit automated emails
- Approval notifications
- Booking confirmations
- Password resets
- Support responses

### 11.3 Maintenance Mode
- Toggle maintenance mode
- Custom maintenance message
- Exclude admin from maintenance
- Scheduled maintenance

---

## 12. Audit Logging

### 12.1 Admin Activity Log
- Track all admin actions
- Who performed action
- What action was taken
- When it happened
- What data was changed
- Cannot be deleted

### 12.2 User Activity Log
- Login/logout events
- Profile changes
- Booking history
- Payment events
- Suspicious activity alerts

---

## Implementation Priority

### Phase 1: Core Admin Functions (Week 1-2)
1. Admin authentication & role
2. Admin dashboard with basic stats
3. User management (view, suspend, delete)
4. Listing management (approve/reject)
5. Basic booking view

### Phase 2: Booking Management (Week 2-3)
6. Detailed booking management
7. Cancel/refund functionality
8. Booking dispute handling
9. Message monitoring

### Phase 3: Support System (Week 3-4)
10. Support ticket system
11. Ticket management interface
12. Internal notes & comments
13. Knowledge base integration

### Phase 4: Advanced Features (Week 4-5)
14. Financial dashboard
15. Analytics & reporting
16. Content moderation tools
17. System settings
18. Audit logging

---

## Screen Breakdown

### New Screens to Create:
1. **AdminDashboard.tsx** - Main admin home
2. **UserManagement.tsx** - User list and details
3. **ListingManagement.tsx** - Listing approval and management
4. **BookingManagement.tsx** - All bookings view
5. **BookingDetails.tsx** - Detailed booking view (admin version)
6. **SupportTickets.tsx** - Support ticket list
7. **TicketDetails.tsx** - Individual ticket view
8. **ReviewsManagement.tsx** - Review moderation
9. **FinancialDashboard.tsx** - Financial overview
10. **AnalyticsDashboard.tsx** - Analytics and charts
11. **SystemSettings.tsx** - Platform settings
12. **AuditLog.tsx** - Activity log viewer

### Modified Screens:
1. **AuthContext.tsx** - Add admin role
2. **BottomNavigation.tsx** - Add admin-only nav items
3. **UserProfile.tsx** - Add admin functions for viewing

---

## Database Changes Required

### User Table Addition:
```sql
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN admin_level INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN admin_notes TEXT;
```

### New Tables:
```sql
-- Support Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  subject VARCHAR(200),
  category VARCHAR(50),
  priority VARCHAR(20),
  status VARCHAR(20),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Ticket Messages
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id),
  sender_id UUID REFERENCES users(id),
  message TEXT,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin Audit Log
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES users(id),
  action VARCHAR(100),
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reported Content
CREATE TABLE reported_content (
  id UUID PRIMARY KEY,
  reporter_id UUID REFERENCES users(id),
  content_type VARCHAR(50),
  content_id UUID,
  reason TEXT,
  status VARCHAR(20),
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Security Considerations

### 1. Access Control
- Admin role verification on every action
- Token expiration and refresh
- Session management
- IP whitelisting (optional)

### 2. Data Protection
- Sensitive data encryption
- PCI compliance for payment data
- GDPR compliance for EU users
- Anonymize user data for analytics

### 3. Audit Trail
- All admin actions logged
- Immutable log (cannot delete)
- Regular log review
- Alert on suspicious patterns

### 4. Permissions
- Granular permissions per admin level
- Read-only mode for some admins
- Action confirmations for destructive operations
- Two-factor authentication for admins

---

## User Experience Considerations

### 1. Admin-Only Navigation
- Different bottom navigation for admins
- Quick access to priority items
- Notification badges for pending tasks
- Recent activity feed

### 2. Responsive Design
- Works on mobile (for admins on-the-go)
- Tablet optimized
- Desktop preferred for complex tasks

### 3. Search & Filters
- Powerful search across all entities
- Save commonly used filters
- Export filtered results
- Quick filters on dashboard

### 4. Efficiency Tools
- Bulk actions (approve multiple listings)
- Keyboard shortcuts
- Quick actions menu
- Template responses for common support issues

---

## Success Metrics

### For Admin Efficiency:
- Time to approve listing: < 5 minutes
- Time to resolve support ticket: < 24 hours
- Time to process booking cancellation: < 10 minutes

### For Platform Health:
- Listing approval rate
- Support ticket resolution rate
- Dispute resolution time
- User satisfaction with admin response

---

## Testing Requirements

### 1. Functionality Tests
- All admin actions work correctly
- User impersonation safe and secure
- Refunds process correctly
- Notifications sent to users

### 2. Security Tests
- Unauthorized access blocked
- Audit logs capture all actions
- Sensitive data protected
- XSS/SQL injection prevention

### 3. User Journey Tests
- Admin can help camper with booking issue
- Admin can approve farmer's listing
- Admin can resolve dispute fairly
- Support ticket workflow complete

---

## Timeline Estimate

- **Phase 1:** 2 weeks (Core functions)
- **Phase 2:** 1 week (Booking management)
- **Phase 3:** 1 week (Support system)
- **Phase 4:** 1 week (Advanced features)

**Total: 4-5 weeks**

---

## Questions for Prioritization

1. Should we implement admin role before backend migration, or after?
2. What is the primary use case? (User support, content moderation, both?)
3. How many admins will we have?
4. What admin actions are most critical?
5. Do we need real-time notifications for admins?

---

## Next Steps

Once approved:
1. Add admin role to user schema
2. Create admin authentication
3. Build admin dashboard
4. Implement user management
5. Add listing approval workflow
6. Create booking management interface
7. Build support ticket system
8. Add analytics dashboard
9. Test thoroughly
10. Deploy to production


