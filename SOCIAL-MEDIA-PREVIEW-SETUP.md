
# Social Media Preview Setup

## Overview

This document explains how the social media preview functions are configured to work without JWT verification, which is necessary for social media platforms like Facebook, Twitter, and WhatsApp to be able to access preview information for shared links.

## Why JWT Verification Must Be Disabled

Social media crawlers cannot include a JWT token in the authorization header. When crawlers fetch link previews, they need to access our endpoints without authentication. Therefore, Supabase's JWT verification must be disabled for these specific functions.

## Functions That Require Disabled JWT Verification

The following functions must have JWT verification disabled:

1. `smart-link-seo` - Provides optimized HTML for social media previews
2. `smart-link-meta` - Provides JSON metadata about smart links
3. `whatsapp-debug` - Helps debug WhatsApp crawler issues

## How JWT Verification Is Disabled

Three measures have been implemented to ensure JWT verification remains disabled:

1. **Function-specific config.toml files**: 
   - Located at `supabase/functions/function-name/config.toml`
   - Each contains `verify_jwt = false`

2. **Main Supabase config.toml**:
   - Located at `supabase/config.toml`
   - Contains sections for each function with `verify_jwt = false`

3. **GitHub Actions Workflows**:
   - Located at `.github/workflows/deploy-*.yml`
   - Automatically deploys the functions with the `--no-verify-jwt` flag
   - Updates both config files to ensure they have the correct settings
   - Runs whenever changes are made to the functions or their configurations

## GitHub Secrets Required

The GitHub Actions workflows require two secrets to be set in your GitHub repository:

1. `SUPABASE_ACCESS_TOKEN`: Your Supabase access token
   - Generate this in the Supabase dashboard under Account → Access Tokens

2. `SUPABASE_PROJECT_ID`: Your Supabase project ID
   - This is the value of `project_id` in your config.toml (e.g., "owtufhdsuuyrgmxytclj")

## Manual Deployment (If Needed)

If you ever need to manually deploy any of these functions, always use:

```bash
supabase functions deploy function-name --no-verify-jwt
```

Never deploy these functions without the `--no-verify-jwt` flag, as it will cause social media previews to fail.

## Troubleshooting

If social media previews stop working after a deployment:

1. Check the Supabase dashboard to see if JWT verification has been re-enabled
2. If it has, disable it manually in the dashboard
3. Make sure the GitHub Actions workflows are running correctly
4. Verify that both config.toml files have the correct settings
5. Re-deploy the functions with the `--no-verify-jwt` flag
