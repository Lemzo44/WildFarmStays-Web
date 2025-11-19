# How to Remove .env from Git Tracking

## The Problem
Even though `.env` is in `.gitignore`, if it was committed before being added to `.gitignore`, Git will continue to track it.

## Solution: Remove from Git Tracking

### Using GitHub Desktop:

1. **Delete the .env file from your computer** (temporarily)
   - Go to: `C:\Users\paull\Documents\GitHub\WildFarmStays-Web`
   - Delete the `.env` file (move to Recycle Bin)

2. **In GitHub Desktop:**
   - You should see `.env` in "Changes" as deleted
   - Write commit message: "Remove .env file from git tracking"
   - Click "Commit to main"
   - Click "Push origin"

3. **Recreate .env file locally:**
   - Create new `.env` file in project root
   - Add your environment variables
   - **VERIFY**: Check GitHub Desktop "Changes" tab - `.env` should NOT appear

### If .env Still Appears After Recreation:

If after recreating `.env`, it still shows in GitHub Desktop:

1. In GitHub Desktop, right-click on `.env` in the Changes list
2. Select "Ignore" or "Discard"
3. This will ensure it's properly ignored

## Verification

After completing these steps:
- ✅ `.env` file exists on your computer
- ✅ `.env` does NOT appear in GitHub Desktop "Changes" tab
- ✅ `.env` is in `.gitignore` file

