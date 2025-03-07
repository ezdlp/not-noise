# Stripe Charges Migration

This document provides instructions for migrating Stripe charges data to a custom database table that can be accessed via MCP.

## Table Structure

The `custom_stripe_charges` table has the following structure:

| Column Name    | Data Type                 | Description                          |
|----------------|---------------------------|--------------------------------------|
| id             | TEXT (Primary Key)        | The Stripe charge ID                 |
| amount         | BIGINT                    | Amount in cents/smallest currency unit |
| currency       | TEXT                      | Currency code (e.g., "usd")          |
| customer       | TEXT                      | Stripe customer ID                   |
| description    | TEXT                      | Charge description                   |
| invoice        | TEXT                      | Associated invoice ID                |
| payment_intent | TEXT                      | Associated payment intent ID         |
| status         | TEXT                      | Charge status (e.g., "succeeded")    |
| created        | TIMESTAMP WITHOUT TIME ZONE | When the charge was created        |
| attrs          | JSONB                     | Additional metadata                  |
| last_updated   | TIMESTAMP DEFAULT NOW()   | When the record was last updated    |

## Migration Methods

We've provided three different methods to migrate Stripe charges:

### Method 1: Supabase Webhook (Automated Updates)

We've updated the existing Stripe webhook to handle charge events and sync them to the custom table.

1. Deploy the webhook function:
   ```bash
   cd supabase/functions
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```

2. Configure Stripe webhook in your Stripe Dashboard:
   - Go to Developers > Webhooks
   - Add endpoint: `https://[YOUR-PROJECT-REF].supabase.co/functions/v1/stripe-webhook`
   - Select Events: `charge.succeeded`, `charge.updated`, `charge.refunded`, `charge.captured`

### Method 2: Direct Migration via Supabase Client

This method migrates existing charges directly using the Supabase client:

1. Install dependencies:
   ```bash
   npm install dotenv stripe @supabase/supabase-js
   ```

2. Run the migration script:
   ```bash
   node scripts/stripe-charges-migration.js
   ```

### Method 3: SQL Generation for MCP (Recommended)

This method generates SQL statements and uses MCP to execute them:

1. Install dependencies:
   ```bash
   npm install dotenv stripe
   ```

2. Generate SQL file:
   ```bash
   node scripts/stripe-charges-sql-migration.js
   ```

3. Run the generated SQL file using MCP:
   - Open the generated SQL file
   - Execute it via MCP's SQL query tool

## Troubleshooting

### Connection Issues

If you encounter connection issues with the Supabase client, try Method 3 (SQL Generation for MCP).

### Missing Charges

If some charges are missing, check:

1. Stripe API limitations (default only returns charges from the last 30 days)
2. Pagination settings in the migration scripts
3. Webhook setup for real-time updates

### Data Discrepancies

If charge data doesn't match the foreign table:

1. Verify the Stripe API version used
2. Check the webhook handler for correct field mapping
3. Ensure the migration script handles all charge fields

## Usage Examples

### Querying Charges via MCP

```sql
-- Get all charges for a specific customer
SELECT * FROM custom_stripe_charges WHERE customer = 'cus_1234567890';

-- Get total revenue by currency
SELECT currency, SUM(amount)/100 as total 
FROM custom_stripe_charges 
WHERE status = 'succeeded' 
GROUP BY currency;

-- Get charges within a date range
SELECT * FROM custom_stripe_charges 
WHERE created BETWEEN '2023-01-01' AND '2023-12-31';
``` 