
# Supabase Edge Functions

This directory contains all Edge Functions for the Soundraiser application. These serverless functions handle various backend operations from payment processing to SEO management.

## JWT Verification System

Some functions in this project need to be publicly accessible without JWT verification, while others should be protected. We use a marker-based system to manage this consistently:

### How It Works

1. Functions with a `.no-verify-jwt` file in their directory will be deployed without JWT verification.
2. Functions without this marker will be deployed with standard JWT verification.
3. The `deploy-functions.sh` script handles this automatically during deployment.
4. Our GitHub Actions workflow ensures consistent deployment settings across all environments.

### Public vs Protected Functions

#### Public Functions (No JWT Verification)
These functions need to be accessible without authentication:

- **Payment Processing**
  - `stripe-webhook` - Processes incoming Stripe webhooks
  - `verify-payment-session` - Public verification endpoint

- **SEO/Sitemap**
  - `sitemap` - Universal sitemap handler (both index and files)
  - `sitemap-generator` - Regenerates and maintains sitemaps
  - `sitemap-cache` - Caches sitemap data
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
- `check-existing-users` - Admin-only user verification
- Other admin/user-specific functions

## Automated Deployment Process

Our functions are deployed automatically through GitHub Actions when:
1. Changes are pushed to the `main` branch 
2. Files in the `supabase/functions` directory are modified

The workflow handles:
- Setting up the Supabase CLI
- Deploying functions with appropriate JWT verification settings
- Verifying successful deployment and settings
- Logging deployment results for auditing

### Manual Deployment Instructions

For local development or manual deployment:

```bash
# From project root:
chmod +x ./supabase/deploy-functions.sh
./supabase/deploy-functions.sh
```

### Adding a New Function

When creating a new Edge Function:

1. Determine if it needs public access or authentication
2. For public functions, add a `.no-verify-jwt` file in the function directory
3. For protected functions, no additional action is needed
4. Update config.toml with matching settings (for consistency)
5. The function will be automatically deployed with the correct settings

## Troubleshooting

If you encounter JWT-related issues:

1. Check the deployment logs in GitHub Actions
2. Verify that the function has the correct marker (or lack thereof)
3. Inspect the function settings in Supabase Console
4. If issues persist, you can manually deploy using the script

For persistent issues, review the detailed deployment logs saved in the `supabase` directory.
