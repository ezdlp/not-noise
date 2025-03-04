# Stripe Webhook Setup

## Overview

This document explains how the Stripe webhook function is configured to work without JWT verification, which is necessary for Stripe to be able to call the webhook endpoint.

## Why JWT Verification Must Be Disabled

Stripe webhook calls cannot include a JWT token in the authorization header. When Stripe sends events to your webhook endpoint, it uses its own authentication method (a signature in the `stripe-signature` header). Therefore, Supabase's JWT verification must be disabled for this specific function.

## How JWT Verification Is Disabled

Three measures have been implemented to ensure JWT verification remains disabled:

1. **Function-specific config.toml**: 
   - Located at `supabase/functions/stripe-webhook/config.toml`
   - Contains `verify_jwt = false`

2. **Main Supabase config.toml**:
   - Located at `supabase/config.toml`
   - Contains a section for the stripe-webhook function with `verify_jwt = false`

3. **GitHub Actions Workflow**:
   - Located at `.github/workflows/deploy-stripe-webhook.yml`
   - Automatically deploys the function with the `--no-verify-jwt` flag
   - Updates both config files to ensure they have the correct settings
   - Runs whenever changes are made to the function or its configuration

## GitHub Secrets Required

The GitHub Actions workflow requires two secrets to be set in your GitHub repository:

1. `SUPABASE_ACCESS_TOKEN`: Your Supabase access token
   - Generate this in the Supabase dashboard under Account → Access Tokens

2. `SUPABASE_PROJECT_ID`: Your Supabase project ID
   - This is the value of `project_id` in your config.toml (e.g., "owtufhdsuuyrgmxytclj")

To add these secrets:
1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" → "Actions"
4. Click on "New repository secret" and add each secret

## Manual Deployment (If Needed)

If you ever need to manually deploy the Stripe webhook function, always use:

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

Never deploy this function without the `--no-verify-jwt` flag, as it will cause Stripe webhooks to fail.

## Troubleshooting

If Stripe webhooks stop working after a deployment:

1. Check the Supabase dashboard to see if JWT verification has been re-enabled
2. If it has, disable it manually in the dashboard
3. Make sure the GitHub Actions workflow is running correctly
4. Verify that both config.toml files have the correct settings
5. Re-deploy the function with the `--no-verify-jwt` flag

## Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [GitHub Actions Documentation](https://docs.github.com/en/actions) 