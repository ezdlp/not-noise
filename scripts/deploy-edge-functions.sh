
#!/bin/bash

# Secure Edge Function Deployment Script
# This script deploys functions using Supabase secrets

# Check if required environment variables are configured in Supabase
echo "Deploying Edge Functions to project: owtufhdsuuyrgmxytclj"

# Deploy ALL Edge Functions with explicit settings
echo "Deploying create-checkout-session function..."
npx supabase functions deploy create-checkout-session --project-ref owtufhdsuuyrgmxytclj

echo "Deploying verify-payment-session function..."
npx supabase functions deploy verify-payment-session --project-ref owtufhdsuuyrgmxytclj

echo "Deploying stripe-webhook function (JWT disabled)..."
npx supabase functions deploy stripe-webhook --project-ref owtufhdsuuyrgmxytclj --no-verify-jwt

echo "Edge Functions deployment complete!"
echo "Run 'npx supabase functions logs --project-ref owtufhdsuuyrgmxytclj' to monitor for errors"
