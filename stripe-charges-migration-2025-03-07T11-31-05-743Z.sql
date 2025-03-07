BEGIN;

-- Clear existing data (optional - remove if you want to preserve existing data)
TRUNCATE TABLE custom_stripe_charges;

-- Insert charge data from Stripe
INSERT INTO custom_stripe_charges (
  id, amount, currency, customer, description, 
  invoice, payment_intent, status, created, attrs, last_updated
) VALUES (
  'ch_3QzAPcFx6uwYcH3S0AzU7ElZ',
  600,
  'usd',
  'cus_RswIwOLA0Pymwz',
  'Subscription creation',
  'in_1QzAPcFx6uwYcH3S52bBmjaJ',
  'pi_3QzAPcFx6uwYcH3S0G1kAn0B',
  'succeeded',
  '2025-03-05T05:22:33.000Z',
  '{}'::jsonb,
  NOW()
);
