# WildFarmStays-Web Deployment Guide

## Deployment to Vercel via GitHub

This guide will walk you through deploying the WildFarmStays-Web application to Vercel through GitHub.

---

## Prerequisites

- ✅ GitHub account
- ✅ Vercel account (free at https://vercel.com)
- ✅ Git installed on your machine
- ✅ Project code ready

---

## Step-by-Step Deployment Process

### Phase 1: Prepare Your Project

#### 1.1 Verify Project Structure
Ensure your project has these files:
- `package.json` (with version 1.0.0)
- `vite.config.ts`
- `tsconfig.json`
- `vercel.json` (created automatically)
- `src/` directory with all source files

#### 1.2 Test Build Locally
```bash
npm run build
```
This should create a `dist/` folder. If this fails, fix any errors before proceeding.

#### 1.3 Check for Linter Errors
```bash
npm run lint
```
Fix any critical linting errors that could prevent deployment.

---

### Phase 2: Initialize Git Repository

#### 2.1 Initialize Git (if not already done)
```bash
git init
```

#### 2.2 Create .gitignore File
Create a `.gitignore` file if it doesn't exist:
```
node_modules/
dist/
.env
*.log
.DS_Store
node_modules/.cache/
```

#### 2.3 Stage All Files
```bash
git add .
```

#### 2.4 Create Initial Commit
```bash
git commit -m "Initial commit: WildFarmStays-Web v1.0.0"
```

---

### Phase 3: Push to GitHub

#### 3.1 Create a New Repository on GitHub
1. Go to https://github.com/new
2. Repository name: `WildFarmStays-Web` (or your preferred name)
3. Description: "WildFarmStays Web Application - Farm Stay Booking Platform"
4. Make it **Public** or **Private** (your choice)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

#### 3.2 Add GitHub Remote
```bash
git remote add origin https://github.com/YOUR_USERNAME/WildFarmStays-Web.git
```
Replace `YOUR_USERNAME` with your GitHub username.

#### 3.3 Push to GitHub
```bash
git branch -M main
git push -u origin main
```

**Verify**: Go to your GitHub repository and confirm all files are uploaded.

---

### Phase 4: Deploy to Vercel

#### 4.1 Sign Up/Login to Vercel
1. Go to https://vercel.com
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"

#### 4.2 Import Your Project
1. After logging in, click "Add New..." → "Project"
2. Find your `WildFarmStays-Web` repository
3. Click "Import"

#### 4.3 Configure Project Settings
Vercel will auto-detect Vite settings. Verify:

- **Framework Preset**: Vite
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 4.4 Environment Variables (Optional)
If you plan to add environment variables later:
- Click "Environment Variables"
- Add variables like:
  - `VITE_API_URL` (if needed)
  - `VITE_APP_NAME` (if needed)

#### 4.5 Deploy
1. Click "Deploy"
2. Wait for the build to complete (2-5 minutes)
3. You'll see a deployment URL like: `https://wildfarmstays-web.vercel.app`

---

### Phase 5: Verify Deployment

#### 5.1 Test Your Live Site
1. Click the deployment URL
2. Test the login functionality:
   - Email: `camper@test.com`
   - Password: `password123`
3. Navigate through different screens
4. Check that bottom navigation works

#### 5.2 Check Deployment Logs
- Go to your project dashboard on Vercel
- Click "Deployments"
- Click on your latest deployment
- Check "Build Logs" for any errors

---

### Phase 6: Custom Domain (Optional)

#### 6.1 Add Custom Domain
1. Go to your project settings
2. Click "Domains"
3. Enter your domain name
4. Follow DNS configuration instructions

---

## Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Login works with test accounts
- [ ] All screens are accessible
- [ ] Bottom navigation works
- [ ] Data persists (localStorage works)
- [ ] No console errors
- [ ] Mobile responsive layout works

---

## Troubleshooting

### Build Fails
**Error**: `Module not found` or `Transform failed`
**Solution**: 
- Check that all dependencies are in `package.json`
- Run `npm install` locally and test build
- Check Vercel build logs for specific errors

### TypeScript Errors
**Error**: `Expected ")" but found ":"`
**Solution**: 
- Already fixed in `tsconfig.app.json` (strict mode disabled)
- Restart dev server: `npm run dev`

### Routing Issues
**Error**: 404 errors on page refresh
**Solution**: 
- Already handled in `vercel.json` with rewrites
- Ensure all routes return to `index.html`

### Styles Not Loading
**Solution**: 
- Check that CSS files are imported in components
- Verify `src/index.css` and `src/App.css` exist

---

## Continuous Deployment

Every time you push to GitHub:
1. Vercel automatically detects the push
2. Triggers a new build
3. Deploys the updated version
4. Updates your live site

### To Update Your Site:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

---

## Production URLs

After deployment, you'll have:
- **Production URL**: `https://wildfarmstays-web.vercel.app`
- **Preview URLs**: For each pull request
- **Custom Domain**: If configured

---

## Next Steps

1. **Add more features** as needed
2. **Set up environment variables** for production
3. **Configure analytics** (optional)
4. **Add error tracking** (Sentry, etc.)
5. **Set up CI/CD** workflows (already automatic with Vercel)

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review GitHub Actions (if configured)
3. Test build locally first
4. Check Vercel documentation: https://vercel.com/docs

---

## Success!

Your WildFarmStays-Web v1.0.0 is now live on Vercel! 🎉

Access your site at: `https://wildfarmstays-web.vercel.app`







