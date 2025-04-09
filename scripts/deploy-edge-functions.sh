
#!/bin/bash

# Secure Edge Function Deployment Script
# This script avoids storing API keys in the repository

# Check if .env file exists
if [ ! -f "./supabase/.env" ]; then
  echo "Error: ./supabase/.env file not found"
  echo "Please create this file with your Stripe and Supabase credentials"
  exit 1
fi

# Source environment variables
source ./supabase/.env

# Check if required variables are set
if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "Error: STRIPE_SECRET_KEY is not set in ./supabase/.env"
  exit 1
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: Supabase credentials are not set in ./supabase/.env"
  exit 1
fi

# Extract project reference from SUPABASE_URL
PROJECT_REF=$(echo $SUPABASE_URL | sed -E 's/https:\/\/([^.]+).*/\1/')

echo "Deploying Edge Functions to project: $PROJECT_REF"
echo "Using Stripe API version 2024-09-30.acacia"

# Deploy the Edge Functions
echo "Deploying create-checkout-session function..."
npx supabase functions deploy create-checkout-session --project-ref $PROJECT_REF --no-verify-jwt

# Set secrets securely
echo "Setting secrets for Edge Functions..."
npx supabase secrets set \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --project-ref $PROJECT_REF

echo "Edge Functions deployment complete!" 
