# Fix Vercel Repository Connection

## Check Which Repository Vercel is Using:

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Click "Settings" tab
4. Click "Git" section
5. Look at "Repository" - it should show: `WildFarmStays-Web`

## If it shows a different repository:

1. Click "Disconnect" 
2. Click "Connect Git Repository"
3. Search for `WildFarmStays-Web`
4. Select it
5. Click "Import"
6. Vercel will redeploy automatically

## After connecting correct repository:

- New deployments will use the correct GitHub repo
- All future changes will deploy correctly







