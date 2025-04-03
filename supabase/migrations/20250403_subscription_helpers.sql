-- Create a function to get users with multiple active subscriptions
CREATE OR REPLACE FUNCTION get_users_with_multiple_active_subscriptions()
RETURNS TABLE (
  user_id uuid,
  subscription_count bigint
) 
LANGUAGE SQL
AS $$
  SELECT user_id, COUNT(*) as subscription_count
  FROM subscriptions
  WHERE status = 'active'
  GROUP BY user_id
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_users_with_multiple_active_subscriptions() TO service_role;

-- Update existing payment process to handle existing subscriptions
CREATE OR REPLACE FUNCTION handle_subscription_update(
  p_user_id uuid,
  p_tier text,
  p_stripe_subscription_id text,
  p_stripe_customer_id text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  existing_subscription_id uuid;
  new_subscription_id uuid;
BEGIN
  -- Check for existing active subscription
  SELECT id INTO existing_subscription_id
  FROM subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;
  
  IF existing_subscription_id IS NOT NULL THEN
    -- Update existing subscription
    UPDATE subscriptions
    SET 
      tier = p_tier,
      stripe_subscription_id = p_stripe_subscription_id,
      stripe_customer_id = p_stripe_customer_id,
      updated_at = NOW()
    WHERE id = existing_subscription_id;
    
    -- Return the id of the updated subscription
    RETURN existing_subscription_id;
  ELSE
    -- Create new subscription and return its id
    INSERT INTO subscriptions (
      id,
      user_id,
      tier,
      stripe_subscription_id,
      stripe_customer_id,
      status,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      p_user_id,
      p_tier,
      p_stripe_subscription_id,
      p_stripe_customer_id,
      'active',
      NOW(),
      NOW()
    )
    RETURNING id INTO new_subscription_id;
    
    RETURN new_subscription_id;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_subscription_update(uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION handle_subscription_update(uuid, text, text, text) TO authenticated; 