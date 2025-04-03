-- Create migration for active_subscriptions view
-- In Supabase, you need to execute this in the SQL editor

-- Create or replace view for active subscriptions
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT *
FROM subscriptions
WHERE status = 'active'
ORDER BY updated_at DESC;

-- Add a comment to the view
COMMENT ON VIEW active_subscriptions IS 'Active subscriptions only (status = active)';

-- Grant appropriate permissions
GRANT SELECT ON active_subscriptions TO service_role;
GRANT SELECT ON active_subscriptions TO authenticated;
GRANT SELECT ON active_subscriptions TO anon; 