# Deploy WildFarmStays-Web v1.0.0 Using GitHub Desktop

## Step-by-Step Guide

### Step 1: Open GitHub Desktop
1. Open **GitHub Desktop** application
2. If not logged in, click "Sign in to GitHub"

### Step 2: Add Your Local Repository
1. In GitHub Desktop, click **File** → **Add Local Repository**
2. Navigate to: `C:\Users\paull\Documents\GitHub\WildFarmStays-Web`
3. Click **Add Repository**

### Step 3: Review Changes
GitHub Desktop will show all your files as "untracked" (new files to be added).

### Step 4: Create Initial Commit
1. At the bottom left, type a commit message: `Initial commit: WildFarmStays-Web v1.0.0`
2. Click **Commit to main**
3. Wait for the commit to complete

### Step 5: Publish Repository to GitHub
1. Click **Publish repository** button (top right)
2. GitHub Desktop will prompt you to create a new repository
3. Fill in:
   - **Name**: `WildFarmStays-Web`
   - **Description**: `WildFarmStays Web Application - Farm Stay Booking Platform`
   - **Keep this code private**: Uncheck (make it public, or keep private if preferred)
4. Click **Publish Repository**
5. Wait for upload to complete

### Step 6: Verify on GitHub
1. GitHub Desktop will show a message: "Your repository has been pushed to GitHub"
2. Click **View on GitHub** to open your repository in browser
3. Verify all files are uploaded

### Step 7: Deploy to Vercel
1. Go to **https://vercel.com**
2. Click **Sign Up** or **Login**
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your GitHub account

### Step 8: Import Your Project
1. After logging in, click **Add New...** → **Project**
2. You should see your `WildFarmStays-Web` repository
3. Click **Import**

### Step 9: Configure Deployment
Vercel will auto-detect settings:
- **Framework Preset**: Vite
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**Note**: These should be correct automatically, but verify they match:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Step 10: Deploy!
1. Click **Deploy**
2. Wait 2-5 minutes for build to complete
3. You'll see: "Congratulations! Your project has been deployed"

### Step 11: Access Your Live Site
1. Click the deployment URL (e.g., `https://wildfarmstays-web.vercel.app`)
2. Your site is now live!

---

## ✅ Test Your Deployment

### Test Accounts:
**Camper Account:**
- Email: `camper@test.com`
- Password: `password123`

**Farmer Account:**
- Email: `farmer@test.com`
- Password: `password123`

### What to Test:
- [ ] Login works
- [ ] Navigate between screens
- [ ] Bottom navigation works
- [ ] View listings
- [ ] Create bookings
- [ ] Send messages
- [ ] All features functional

---

## 🔄 Updating Your Site

Every time you make changes:

### In GitHub Desktop:
1. Make your changes in your code editor
2. GitHub Desktop will show changed files
3. Type commit message (e.g., "Updated search functionality")
4. Click **Commit to main**
5. Click **Push origin** (top right)

### In Vercel:
- Vercel automatically detects the push
- Automatically rebuilds and deploys
- Your site updates automatically!

---

## 🎉 Success!

Your WildFarmStays-Web v1.0.0 is now deployed!

**Live URL**: `https://wildfarmstays-web.vercel.app`

---

## 📝 Troubleshooting

### GitHub Desktop Issues:
- **Can't find repository**: Make sure you're in the correct folder
- **Can't push**: Check internet connection
- **Authentication errors**: Re-login to GitHub

### Vercel Issues:
- **Build fails**: Check Vercel build logs for errors
- **404 errors**: Make sure routing is configured (already done in vercel.json)
- **Styles not loading**: Check that CSS files are imported correctly

---

## 📞 Need Help?

- GitHub Desktop Docs: https://docs.github.com/en/desktop
- Vercel Docs: https://vercel.com/docs
- Your project is ready to deploy!






