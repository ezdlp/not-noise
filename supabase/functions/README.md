
# Supabase Edge Functions

This directory contains all Edge Functions for the Soundraiser application. These serverless functions handle various backend operations from payment processing to SEO management.

## JWT Verification System

Some functions in this project need to be publicly accessible without JWT verification, while others should be protected. We use a marker-based system to manage this consistently:

### How It Works

1. Functions with a `.no-verify-jwt` file in their directory will be deployed without JWT verification.
2. Functions without this marker will be deployed with standard JWT verification.
3. The `deploy-functions.sh` script handles this automatically during deployment.

### Public vs Protected Functions

#### Public Functions (No JWT Verification)
These functions need to be accessible without authentication:

- **Payment Processing**
  - `stripe-webhook` - Processes incoming Stripe webhooks
  - `verify-payment-session` - Public verification endpoint

- **SEO/Sitemap**
  - `sitemap` - Main sitemap handler
  - `sitemap-file` - Serves individual sitemap files
  - `regenerate-sitemap` - Triggers sitemap updates
  - `sitemap-cache` - Caches sitemap data
  - `ping-search-engines` - Notifies search engines of updates
  - `sitemap-health` - Monitors sitemap status

- **Public Services**
  - `get-odesli-links` - Music link aggregation service
  - `spotify-search` - Public search functionality
  - `verify-recaptcha` - Form spam protection

#### Protected Functions (With JWT Verification)
These functions require user authentication:

- `create-checkout-session` - Initiates payment flows
- `create-portal-link` - Manages subscription portals
- `get-analytics-keys` - Retrieves user-specific analytics
- `send-notification` - Internal notification system
- Other admin/user-specific functions

## Deployment Instructions

### Never deploy functions directly using Supabase CLI!

Instead, always use our deployment script:

```bash
# From project root:
./supabase/deploy-functions.sh
```

This script will:
1. Check each function directory for the presence of a `.no-verify-jwt` marker
2. Deploy with or without JWT verification accordingly
3. Provide a detailed summary of the deployment

### Adding a New Function

When creating a new Edge Function:

1. Determine if it needs public access or authentication
2. For public functions, add a `.no-verify-jwt` file in the function directory
3. For protected functions, no additional action is needed
4. Update config.toml with matching settings (for consistency)
5. Use the deployment script to deploy

## Troubleshooting

If you encounter JWT-related issues:

1. Verify that the function has the correct marker (or lack thereof)
2. Check that you're using the deployment script and not direct CLI commands
3. Verify the function's config.toml matches the intended JWT behavior

For persistent issues, check the deployment logs for details on which flags were applied.
