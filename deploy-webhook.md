# Deploying the Stripe Webhook

To deploy the Stripe webhook Edge Function to your Supabase project, follow these steps:

## 1. Install the Supabase CLI

If you haven't already installed the Supabase CLI, follow the instructions at:
https://supabase.com/docs/guides/cli

## 2. Login to your Supabase account

```bash
supabase login
```

## 3. Set up your Supabase project locally

```bash
supabase init
```

## 4. Set required secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
```

## 5. Deploy the webhook function

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

The `--no-verify-jwt` flag is important since the webhook needs to be accessible by Stripe without authentication.

## 6. Get the function URL

```bash
supabase functions list
```

Note the URL for the `stripe-webhook` function.

## 7. Configure Stripe webhook in the Stripe Dashboard

1. Go to the Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Enter your function URL: `https://[YOUR-PROJECT-REF].supabase.co/functions/v1/stripe-webhook`
4. Select events to listen for:
   - customer.*
   - customer.subscription.*
   - product.*
   - price.*
   - invoice.*
   - charge.*
5. Click "Add endpoint"
6. Reveal the signing secret and use it for the `STRIPE_WEBHOOK_SECRET` environment variable

## 8. Test the webhook

You can test the webhook directly from the Stripe Dashboard:

1. Go to the webhook you created
2. Click "Send test webhook"
3. Select an event type
4. Click "Send test webhook"

Check the Supabase logs to verify that your function received and processed the webhook correctly:

```bash
supabase functions logs stripe-webhook
``` 