# Edge Function Deployment Guide

## SECURITY NOTICE

⚠️ **IMPORTANT: NEVER commit API keys, tokens, or secrets to the repository!** ⚠️

This deployment guide has been updated to use a secure deployment method that avoids exposing sensitive keys.

## Secure Deployment Process

We've created a script that securely handles the deployment process without exposing API keys in the repository:

```bash
# Make sure the script is executable
chmod +x ./scripts/deploy-edge-functions.sh

# Run the deployment script
./scripts/deploy-edge-functions.sh
```

The script will:
1. Read environment variables from a local `.env` file (not committed to Git)
2. Deploy the Edge Functions to your Supabase project
3. Set the required secrets securely

## Environment Setup

1. Create a `.env` file in the `supabase` directory with your actual keys:
   ```
   STRIPE_SECRET_KEY=your_actual_stripe_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_actual_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
   ```

2. Ensure this file is in your `.gitignore` and never committed to the repository

## Latest Updates

1. Updated Stripe package from `14.21.0` to `15.7.0` 
2. Added enhanced error logging to diagnose checkout issues
3. Simplified and standardized error responses
4. Created database logging for Edge Function errors
5. Improved security practices for handling API keys

## Deployment Steps for Edge Functions

To deploy the updated Edge Functions, follow these steps:

1. **Set up Supabase CLI**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   ```

2. **Deploy the create-checkout-session function**
   ```bash
   cd /Users/ezequieldelaparra/Documents/GitHub/not-noise
   supabase functions deploy create-checkout-session --project-ref owtufhdsuuyrgmxytclj
   ```

3. **Set environment variables**
   ```bash
   supabase secrets set --env-file ./supabase/.env --project-ref owtufhdsuuyrgmxytclj
   ```

4. **Verify deployment**
   ```bash
   supabase functions list --project-ref owtufhdsuuyrgmxytclj
   ```

## Previous Key Changes

1. Changed Stripe API version from `2024-09-30.acacia` to `2023-10-16` in `create-checkout-session/index.ts`
2. Updated the import map to use the standard Stripe import
3. Fixed promotion status to use `payment_pending` instead of `pending`
4. Stored sensitive keys securely in the database

## Testing

After deployment, test the checkout flow by:
1. Going to https://soundraiser.io/spotify-playlist-promotion/pricing
2. Selecting a track and package
3. Verifying that the checkout flow works without errors

## Troubleshooting

If issues persist:
1. Check Edge Function logs in Supabase dashboard
2. Look for errors in the `edge_function_logs` table we created
3. Verify that environment variables are set correctly
4. Make sure the correct Stripe API key format is being used
5. Check the browser console for any client-side errors

## Update via Database (if CLI deployment fails)

If you're unable to deploy via CLI, update the Edge Function from the database:

```sql
-- Update Stripe key in environment variables
UPDATE edge_functions.functions
SET 
  secrets = jsonb_set(
    secrets, 
    '{STRIPE_SECRET_KEY}', 
    '"sk_live_***********************************"'
  ),
  version = version + 1,
  updated_at = now()
WHERE name = 'create-checkout-session';
```

## Manual Secrets Update (Alternative Method)

If you need to update secrets manually through the Supabase dashboard:

1. Go to your project in the Supabase dashboard
2. Navigate to Edge Functions
3. Select the function you want to update
4. Add/update the environment variables in the "Secrets" section 