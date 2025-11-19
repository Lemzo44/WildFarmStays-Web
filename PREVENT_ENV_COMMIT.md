# How to Prevent Committing .env Files

## ⚠️ CRITICAL: Never Commit .env Files

The `.env` file contains sensitive API keys and should **NEVER** be committed to GitHub.

## How to Remove .env from GitHub (If Already Committed)

### Using GitHub Desktop:

1. **Delete the .env file from your computer** (temporarily)
   - Go to: `C:\Users\paull\Documents\GitHub\WildFarmStays-Web`
   - Delete the `.env` file

2. **In GitHub Desktop:**
   - You should see `.env` listed in "Changes" as deleted
   - Write commit message: "Remove .env file from repository"
   - Click "Commit to main"
   - Click "Push origin"

3. **Recreate .env file locally** (it will be ignored by git)
   - Create new `.env` file in project root
   - Add your environment variables
   - **Verify it doesn't show in GitHub Desktop Changes tab**

## How to Check Before Committing

### Always Check Before Committing:

1. **In GitHub Desktop, before clicking "Commit":**
   - Look at the "Changes" tab
   - **NEVER commit if you see `.env` in the list**
   - If you see it, uncheck it or discard the changes

2. **Visual Check:**
   - `.env` should have a red X or be grayed out
   - If it's green (new file) or blue (modified), DO NOT COMMIT IT

## Best Practices

1. **Always check the Changes tab** before committing
2. **Never use "Commit all"** if you're unsure
3. **Use `.env.example`** as a template (without real keys)
4. **Keep `.env` file closed** when committing in GitHub Desktop

## If You Accidentally Commit .env

1. **Immediately revoke the exposed API key** in Google Cloud Console
2. **Delete the .env file** from your computer
3. **Commit the deletion** and push to GitHub
4. **Create a new API key** with restrictions
5. **Recreate .env locally** (it will be ignored)

## Verification

After recreating `.env`:
- ✅ File exists on your computer
- ✅ File does NOT appear in GitHub Desktop "Changes" tab
- ✅ File is listed in `.gitignore`

