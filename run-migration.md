# Running the Stripe Data Migration

This guide will help you run the one-time migration to populate your custom Stripe tables with data from the Stripe API.

## Prerequisites

1. Make sure your `.env.local` file contains the necessary API keys:

```
VITE_STRIPE_SECRET_KEY=your_stripe_secret_key_here
VITE_SUPABASE_URL=https://owtufhdsuuyrgmxytclj.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

2. Install required dependencies:

```bash
npm install @supabase/supabase-js dotenv stripe
```

## Run the Migration Script

```bash
node scripts/stripe-migration.js
```

## Verify the Migration

You can verify that the data was migrated correctly by checking your custom tables:

```sql
-- Count rows in each table
SELECT 'custom_stripe_customers' as table_name, COUNT(*) FROM custom_stripe_customers
UNION ALL
SELECT 'custom_stripe_subscriptions' as table_name, COUNT(*) FROM custom_stripe_subscriptions
UNION ALL
SELECT 'custom_stripe_products' as table_name, COUNT(*) FROM custom_stripe_products
UNION ALL
SELECT 'custom_stripe_prices' as table_name, COUNT(*) FROM custom_stripe_prices
UNION ALL
SELECT 'custom_stripe_invoices' as table_name, COUNT(*) FROM custom_stripe_invoices
UNION ALL
SELECT 'custom_stripe_charges' as table_name, COUNT(*) FROM custom_stripe_charges;
```

## Handling Large Datasets

The migration script is designed to handle up to 100 records per table by default. If you have more than that, you'll need to modify the script to handle pagination:

1. Open the `scripts/stripe-migration.js` file
2. Uncomment and implement the `migrateAllPages` function
3. Replace the call to `migrateStripeData()` with `migrateAllPages()`

## Troubleshooting

### API Key Issues

If you see errors like "Invalid API Key provided", make sure your Stripe API key is correct and has the necessary permissions.

### Rate Limiting

If you hit rate limits, the script may fail. In that case, you can:

1. Add delays between API calls
2. Split the migration into smaller chunks

### Database Connection Issues

If you have issues connecting to Supabase, verify that your service role key has the necessary permissions to write to the custom tables. 