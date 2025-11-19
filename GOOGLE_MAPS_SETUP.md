# Google Maps Setup Guide

## Overview

The Search Screen now uses Google Maps to display farm listings with interactive markers. This guide will help you set up the Google Maps API key.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A GCP project with billing enabled (Google Maps requires billing, but offers free credits)

## Step 1: Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API** ⭐ (REQUIRED - This is the one you need!)
     - Go to **APIs & Services** → **Library**
     - Search for "Maps JavaScript API"
     - Click on it and press **Enable**
   - **Places API** (optional, for location search features)
   - **Geocoding API** (optional, for address to coordinates conversion)

**Note:** Do NOT use "Maps Embed API" - that's for simple static maps. You need "Maps JavaScript API" for interactive maps with markers.

4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **API Key**
6. Copy your API key

## Step 2: Restrict Your API Key (Recommended for Production)

1. Click on your API key to edit it
2. Under **Application restrictions**, select **HTTP referrers (web sites)**
3. Add your domain(s):
   - `localhost:*` (for local development)
   - `yourdomain.com/*` (for production)
   - `*.amplifyapp.com/*` (if using AWS Amplify)
4. Under **API restrictions**, select **Restrict key**
5. Select only the APIs you need:
   - Maps JavaScript API
   - Places API (if using)
   - Geocoding API (if using)
6. Click **Save**

## Step 3: Configure Environment Variables

### For Local Development

Create a `.env` file in the project root:

```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### For AWS Amplify

1. Go to your AWS Amplify Console
2. Select your app
3. Go to **Environment variables**
4. Add a new variable:
   - **Key:** `VITE_GOOGLE_MAPS_API_KEY`
   - **Value:** Your Google Maps API key
5. Save and redeploy

## Step 4: Verify Setup

1. Start your development server: `npm run dev`
2. Navigate to the Search screen
3. You should see an interactive Google Map with:
   - Farm listing markers (green tent icons)
   - Your location marker (blue dot, if location permission granted)
   - Clickable markers that show listing info

## Features

- **Interactive Map**: Pan, zoom, and explore farm locations
- **Listing Markers**: Green tent icons show farm locations
- **Info Windows**: Click markers to see listing details
- **User Location**: Blue dot shows your current location (if permission granted)
- **Auto-fit Bounds**: Map automatically adjusts to show all listings

## Troubleshooting

### Map Not Loading

- **Check API Key**: Verify `VITE_GOOGLE_MAPS_API_KEY` is set correctly
- **Check Console**: Look for Google Maps API errors in browser console
- **Check Billing**: Ensure billing is enabled on your GCP project
- **Check API Enabled**: Verify **Maps JavaScript API** (NOT Embed API) is enabled in GCP Console
- **Check API Restrictions**: If you restricted your API key, ensure Maps JavaScript API is allowed

### Markers Not Showing

- **Check Coordinates**: Ensure listings have `latitude` and `longitude` values
- **Check Console**: Look for coordinate-related errors
- **Verify Data**: Check that listings are being loaded correctly

### API Key Errors

- **Quota Exceeded**: Check your Google Cloud billing and quotas
- **Referrer Not Allowed**: Add your domain to API key restrictions
- **API Not Enabled**: Enable Maps JavaScript API in GCP Console

## Cost Considerations

Google Maps offers:
- **$200 free credit per month** (covers most small to medium applications)
- **Pay-as-you-go pricing** after free credits
- Typical usage: ~$0.007 per map load

For most applications, the free tier is sufficient.

## Security Notes

- **Never commit API keys to version control**
- **Use environment variables** for all API keys
- **Restrict API keys** to specific domains and APIs
- **Monitor usage** in Google Cloud Console

## Support

For Google Maps API issues, refer to:
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Google Cloud Console](https://console.cloud.google.com/)

