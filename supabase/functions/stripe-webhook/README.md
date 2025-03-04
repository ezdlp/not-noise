# Stripe Webhook Function

This function handles Stripe webhook events. It processes events such as subscription updates, payment successes, and other Stripe-related notifications.

## Important: JWT Verification

This function **must** have JWT verification disabled to work properly with Stripe webhooks. Stripe cannot provide a JWT token when sending webhook events.

The following measures have been implemented to ensure JWT verification remains disabled:

1. The function-specific `config.toml` has `verify_jwt = false`
2. The main Supabase `config.toml` has `verify_jwt = false` for this function
3. A GitHub Actions workflow has been set up to deploy this function with the `--no-verify-jwt` flag

## GitHub Actions Workflow

A dedicated GitHub Actions workflow (`.github/workflows/deploy-stripe-webhook.yml`) has been created to:

1. Automatically deploy this function with JWT verification disabled
2. Ensure the config files have the correct settings
3. Run whenever changes are made to this function or its configuration

## Manual Deployment

If you need to manually deploy this function, always use:

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

Never deploy this function without the `--no-verify-jwt` flag, as it will cause Stripe webhooks to fail. 