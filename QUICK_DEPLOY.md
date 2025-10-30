# Quick Deployment Guide - WildFarmStays-Web v1.0.0

## ✅ Pre-Deployment Checklist

- [x] Build successful (`npm run build` works)
- [x] Version updated to 1.0.0
- [x] vercel.json configured
- [x] TypeScript errors resolved
- [x] .gitignore updated

## 🚀 Quick Deployment Steps

### 1. Initialize Git (if not done)
```bash
git init
git add .
git commit -m "Initial commit: WildFarmStays-Web v1.0.0"
```

### 2. Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `WildFarmStays-Web`
3. Create repository (don't initialize)

### 3. Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/WildFarmStays-Web.git
git branch -M main
git push -u origin main
```

### 4. Deploy to Vercel
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import `WildFarmStays-Web`
5. Click "Deploy"

**Done!** Your site will be live at: `https://wildfarmstays-web.vercel.app`

## 📝 Test Accounts

**Camper:**
- Email: `camper@test.com`
- Password: `password123`

**Farmer:**
- Email: `farmer@test.com`
- Password: `password123`

## 🔄 Updating the Site

Every push to `main` branch automatically deploys:
```bash
git add .
git commit -m "Your changes"
git push origin main
```






