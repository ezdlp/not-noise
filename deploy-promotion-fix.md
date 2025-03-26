# Spotify Playlist Promotion Fix Deployment Guide

This guide explains how to deploy the fix for the Spotify playlist promotion feature that was encountering 404 errors during checkout.

## What Was Fixed

1. **Root Cause**: The application was using Next.js style API routes (`/api/payments/create-promotion-checkout`) in a Vite-based application, causing 404 errors.

2. **Solution Implemented**:
   - Added a proxy in the Vite development server to forward API requests to Supabase Edge Functions
   - Updated the Vercel configuration to forward API requests in production
   - Enhanced the `create-checkout-session` Edge Function to handle promotion checkout requests
   - Updated components to use the correct API endpoints

## Deployment Steps

### 1. Deploy the Edge Function

Run the following commands to deploy the updated Edge Function:

```bash
cd supabase
supabase functions deploy create-checkout-session
```

### 2. Deploy the Vite Application

Push your changes to GitHub, which will trigger the Vercel deployment:

```bash
git add .
git commit -m "Fix Spotify playlist promotion checkout"
git push origin main
```

### 3. Verify the Fix

1. Go to the promotion dashboard
2. Search for a track and select it
3. Choose a package tier
4. Verify that the checkout process works correctly
5. Check the logs in the Supabase dashboard for any errors

## Monitoring

After deployment, monitor:

1. Edge Function logs in the Supabase dashboard
2. Vercel deployment logs
3. User feedback on the promotion feature

If issues persist, check:
- Browser console errors
- Edge Function logs for specific error messages
- Verify that the Supabase project IDs and API keys are correctly set in the environment variables 