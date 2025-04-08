
-- Add RLS policies to the active_subscriptions view
ALTER VIEW active_subscriptions SECURITY INVOKER;

-- Allow authenticated users to see only their own subscriptions
CREATE POLICY "Users can view their own active subscriptions"
ON active_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own subscriptions (for new subscriptions)
CREATE POLICY "Users can insert their own subscriptions"
ON subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own subscriptions
CREATE POLICY "Users can update their own subscriptions"
ON subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON active_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON subscriptions TO authenticated;
