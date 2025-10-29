# Supabase Setup Guide for WildFarmStays

## Quick Start

### Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name:** wildfarmstays
   - **Database Password:** (choose a strong password - save it!)
   - **Region:** Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for project to initialize

### Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 3: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase/schema.sql`
3. Paste into SQL Editor
4. Click "Run" (or press Ctrl+Enter)
5. Verify: You should see "Success. No rows returned"

### Step 4: Configure Environment Variables

#### For Local Development:

1. Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_USE_SUPABASE=true
```

2. Replace the values with your actual Supabase credentials from Step 2

#### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add these variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
   - `VITE_USE_SUPABASE` = `true`
4. Redeploy your application

### Step 5: Enable Email Auth (if using Supabase Auth)

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email settings (optional, for production)

### Step 6: Test the Connection

Once you've set up the environment variables:

1. Run `npm run dev`
2. Open browser console
3. Check for any Supabase connection errors
4. Try logging in/registering

---

## Feature Flag

The app uses a feature flag `VITE_USE_SUPABASE` to toggle between:
- `false` or unset → Uses localStorage (current behavior)
- `true` → Uses Supabase database

This allows you to:
- Test Supabase without breaking existing functionality
- Gradually migrate features
- Easily rollback if needed

---

## Troubleshooting

### "Supabase environment variables not set"
- Make sure `.env` file exists in project root
- Check variable names are correct: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart dev server after creating `.env`

### "Failed to connect to Supabase"
- Verify your Supabase project URL is correct
- Check your anon key is correct
- Ensure Supabase project is active (not paused)

### "Row Level Security policy violation"
- This means RLS is blocking your query
- Check the SQL policies in `supabase/schema.sql`
- You may need to adjust policies for your use case

### Database Migration Issues
- Check SQL syntax errors in Supabase SQL Editor
- Ensure all foreign keys reference existing tables
- Verify UUID extension is enabled

---

## Next Steps

After setup:
1. ✅ Test connection with a simple query
2. ✅ Migrate one service (e.g., Bookings) to test
3. ✅ Gradually migrate other services
4. ✅ Remove localStorage fallback once stable

---

## Useful Supabase Resources

- **Dashboard:** https://supabase.com/dashboard
- **Documentation:** https://supabase.com/docs
- **SQL Editor:** https://supabase.com/dashboard/project/_/sql
- **Table Editor:** https://supabase.com/dashboard/project/_/editor

---

## Security Notes

⚠️ **Important:**
- The `anon` key is safe to use in frontend code (it's restricted by RLS policies)
- Never expose your `service_role` key in frontend code
- Always use Row Level Security policies to protect data
- Test RLS policies thoroughly before production

