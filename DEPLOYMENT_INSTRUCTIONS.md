
# Stripe Edge Function Deployment Instructions

To fix the checkout issues, follow these steps:

## 1. Verify Stripe Secret Key

First, make sure your Stripe secret key is correctly set in `supabase/.env`:

```
STRIPE_SECRET_KEY=sk_live_your_actual_key_here
```

Replace the placeholder value with your actual Stripe secret key from the Stripe dashboard.

## 2. Deploy the Edge Functions

Run the deployment script to properly deploy all required Edge Functions:

```bash
# Make the script executable
chmod +x ./scripts/deploy-edge-functions.sh

# Run the deployment script
./scripts/deploy-edge-functions.sh
```

## 3. Verify Deployment

Check that the functions have been deployed successfully:

```bash
npx supabase functions list --project-ref owtufhdsuuyrgmxytclj
```

## 4. Test the Checkout Flow

After deploying the functions, try the checkout flow again on the Spotify playlist promotion pricing page.

## 5. Check Logs for Errors

If issues persist, check the function logs:

```bash
npx supabase functions logs --project-ref owtufhdsuuyrgmxytclj --function-name create-checkout-session
```

## Important Notes

- The Stripe API version is set to `2025-02-24.acacia` to match your Stripe dashboard
- JWT verification is enabled for checkout functions but disabled for webhooks
- Enhanced error logging has been added to help diagnose issues
