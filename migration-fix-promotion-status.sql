
-- First, drop the default value constraint
ALTER TABLE promotions 
ALTER COLUMN status DROP DEFAULT;

-- Convert the existing promotion_status column to text
ALTER TABLE promotions 
ALTER COLUMN status TYPE text USING status::text;

-- Drop the old enum type
DROP TYPE IF EXISTS promotion_status;

-- Create a new promotion_status enum type with new values
CREATE TYPE promotion_status AS ENUM ('payment_pending', 'active', 'delivered', 'cancelled');

-- Now update the text values to match our new enum values
UPDATE promotions
SET status = 
  CASE status
    WHEN 'pending' THEN 'payment_pending'
    WHEN 'completed' THEN 'delivered'
    WHEN 'rejected' THEN 'cancelled'
    ELSE status
  END;

-- Convert the column to use the new enum type
ALTER TABLE promotions
ALTER COLUMN status TYPE promotion_status USING status::promotion_status;

-- Add back the default value
ALTER TABLE promotions 
ALTER COLUMN status SET DEFAULT 'payment_pending'::promotion_status;

-- Fix Jarrod Parker's campaign specifically if it's still in payment_pending
UPDATE promotions
SET status = 'active'
WHERE status = 'payment_pending'
AND id IN (
  SELECT p.id 
  FROM promotions p
  JOIN profiles pr ON p.user_id = pr.id
  WHERE pr.name = 'Jarrod Parker' OR pr.email LIKE '%jarrod%'
);

-- Show the updated promotions for verification
SELECT id, track_name, track_artist, status FROM promotions ORDER BY created_at DESC LIMIT 10;
