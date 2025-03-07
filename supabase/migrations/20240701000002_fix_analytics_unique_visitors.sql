
-- Update the analytics function to correctly count unique visitors
CREATE OR REPLACE FUNCTION get_analytics_dashboard_stats(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_DATE - '30 days'::interval),
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE,
  p_previous_period BOOLEAN DEFAULT true
)
RETURNS TABLE (
  period TEXT,
  product_visits BIGINT,
  smart_link_visits BIGINT,
  signups BIGINT,
  active_users BIGINT,
  pro_subscribers BIGINT,
  revenue NUMERIC,
  social_cards_usage BIGINT,
  meta_pixel_usage BIGINT,
  email_capture_usage BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_length INTERVAL;
  v_prev_start_date TIMESTAMP WITH TIME ZONE;
  v_prev_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate the period length
  v_period_length := p_end_date - p_start_date;
  
  -- Calculate previous period dates
  v_prev_end_date := p_start_date - INTERVAL '1 day';
  v_prev_start_date := v_prev_end_date - v_period_length;

  -- Return current period stats
  RETURN QUERY
  SELECT 
    'current' AS period,
    -- Product visits (excluding smart link pages) - COUNTING UNIQUE SESSIONS
    (SELECT COUNT(DISTINCT session_id) FROM analytics_page_views 
     WHERE created_at BETWEEN p_start_date AND p_end_date
     AND url NOT LIKE '%/link/%'
     AND session_id IS NOT NULL) AS product_visits,
    
    -- Smart link visits
    (SELECT COUNT(*) FROM link_views 
     WHERE viewed_at BETWEEN p_start_date AND p_end_date) AS smart_link_visits,
    
    -- Signups (new user registrations)
    (SELECT COUNT(*) FROM auth.users 
     WHERE created_at BETWEEN p_start_date AND p_end_date) AS signups,
    
    -- Active users (unique users who logged in)
    (SELECT COUNT(DISTINCT user_id) FROM analytics_events 
     WHERE created_at BETWEEN p_start_date AND p_end_date
     AND event_type = 'login'
     AND user_id IS NOT NULL) AS active_users,
    
    -- Pro subscribers
    (SELECT COUNT(DISTINCT user_id) FROM subscriptions 
     WHERE tier = 'pro' 
     AND status = 'active'
     AND created_at <= p_end_date
     AND (current_period_end >= p_start_date OR is_lifetime = true)) AS pro_subscribers,
    
    -- Revenue from Stripe charges
    (SELECT COALESCE(SUM(amount::numeric / 100.0), 0) FROM stripe_charges 
     WHERE created BETWEEN p_start_date AND p_end_date
     AND status = 'succeeded') AS revenue,
    
    -- Social cards usage
    (SELECT COUNT(*) FROM social_media_assets 
     WHERE created_at BETWEEN p_start_date AND p_end_date) AS social_cards_usage,
    
    -- Meta pixel usage (count of smart links with meta pixel added in the period)
    (SELECT COUNT(*) FROM smart_links 
     WHERE meta_pixel_id IS NOT NULL
     AND (meta_pixel_added_at BETWEEN p_start_date AND p_end_date 
          OR (meta_pixel_added_at IS NULL AND created_at BETWEEN p_start_date AND p_end_date))) AS meta_pixel_usage,
    
    -- Email capture usage (count of smart links with email capture enabled in the period)
    (SELECT COUNT(*) FROM smart_links 
     WHERE email_capture_enabled = TRUE
     AND created_at BETWEEN p_start_date AND p_end_date) AS email_capture_usage;

  -- If previous period is requested, add those stats
  IF p_previous_period THEN
    RETURN QUERY
    SELECT 
      'previous' AS period,
      -- Product visits (excluding smart link pages) - COUNTING UNIQUE SESSIONS
      (SELECT COUNT(DISTINCT session_id) FROM analytics_page_views 
       WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date
       AND url NOT LIKE '%/link/%'
       AND session_id IS NOT NULL) AS product_visits,
      
      -- Smart link visits
      (SELECT COUNT(*) FROM link_views 
       WHERE viewed_at BETWEEN v_prev_start_date AND v_prev_end_date) AS smart_link_visits,
      
      -- Signups (new user registrations)
      (SELECT COUNT(*) FROM auth.users 
       WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date) AS signups,
      
      -- Active users (unique users who logged in)
      (SELECT COUNT(DISTINCT user_id) FROM analytics_events 
       WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date
       AND event_type = 'login'
       AND user_id IS NOT NULL) AS active_users,
      
      -- Pro subscribers
      (SELECT COUNT(DISTINCT user_id) FROM subscriptions 
       WHERE tier = 'pro' 
       AND status = 'active'
       AND created_at <= v_prev_end_date
       AND (current_period_end >= v_prev_start_date OR is_lifetime = true)) AS pro_subscribers,
      
      -- Revenue from Stripe charges
      (SELECT COALESCE(SUM(amount::numeric / 100.0), 0) FROM stripe_charges 
       WHERE created BETWEEN v_prev_start_date AND v_prev_end_date
       AND status = 'succeeded') AS revenue,
      
      -- Social cards usage
      (SELECT COUNT(*) FROM social_media_assets 
       WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date) AS social_cards_usage,
      
      -- Meta pixel usage (count of smart links with meta pixel added in the period)
      (SELECT COUNT(*) FROM smart_links 
       WHERE meta_pixel_id IS NOT NULL
       AND (meta_pixel_added_at BETWEEN v_prev_start_date AND v_prev_end_date 
            OR (meta_pixel_added_at IS NULL AND created_at BETWEEN v_prev_start_date AND v_prev_end_date))) AS meta_pixel_usage,
      
      -- Email capture usage (count of smart links with email capture enabled in the period)
      (SELECT COUNT(*) FROM smart_links 
       WHERE email_capture_enabled = TRUE
       AND created_at BETWEEN v_prev_start_date AND v_prev_end_date) AS email_capture_usage;
  END IF;
END;
$$;

-- Also update the improved analytics stats function to count unique visitors correctly
CREATE OR REPLACE FUNCTION get_improved_analytics_stats(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  period TEXT,
  day DATE,
  product_page_views BIGINT,
  smart_link_views BIGINT,
  unique_visitors BIGINT,
  registered_users BIGINT,
  active_users BIGINT,
  pro_subscribers BIGINT,
  total_revenue NUMERIC,
  smart_links_created BIGINT,
  social_assets_created BIGINT,
  meta_pixels_added BIGINT,
  email_capture_enabled BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_end_date TIMESTAMP WITH TIME ZONE;
  v_period_length INTEGER;
  v_prev_start_date TIMESTAMP WITH TIME ZONE;
  v_prev_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set end date to current date if not provided
  v_end_date := COALESCE(p_end_date, CURRENT_TIMESTAMP);
  
  -- Calculate period length in days
  v_period_length := EXTRACT(DAY FROM (v_end_date - p_start_date));
  
  -- Calculate previous period dates
  v_prev_end_date := p_start_date - INTERVAL '1 day';
  v_prev_start_date := v_prev_end_date - (v_end_date - p_start_date);
  
  -- Current period data
  RETURN QUERY
  WITH dates AS (
    SELECT 
      date_trunc('day', dd)::date AS day
    FROM generate_series(
      p_start_date::date,
      v_end_date::date,
      '1 day'::interval
    ) dd
  ),
  -- Product page views (excluding /link/ paths)
  product_views AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(DISTINCT session_id) as view_count
    FROM analytics_page_views
    WHERE created_at BETWEEN p_start_date AND v_end_date
      AND url NOT LIKE '%/link/%'
      AND session_id IS NOT NULL
    GROUP BY 1
  ),
  -- Smart link views (only /link/ paths)
  smart_link_views AS (
    SELECT 
      date_trunc('day', viewed_at)::date AS day,
      COUNT(*) as view_count
    FROM link_views
    WHERE viewed_at BETWEEN p_start_date AND v_end_date
    GROUP BY 1
  ),
  -- Unique visitors
  visitors AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(DISTINCT session_id) as visitor_count
    FROM analytics_page_views
    WHERE created_at BETWEEN p_start_date AND v_end_date
      AND url NOT LIKE '%/link/%'
      AND session_id IS NOT NULL
    GROUP BY 1
  ),
  -- New registered users
  new_users AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(*) as user_count
    FROM auth.users
    WHERE created_at BETWEEN p_start_date AND v_end_date
    GROUP BY 1
  ),
  -- Active users (users who logged in)
  active_users AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(DISTINCT user_id) as user_count
    FROM analytics_events
    WHERE created_at BETWEEN p_start_date AND v_end_date
      AND user_id IS NOT NULL
      AND event_type = 'login'
    GROUP BY 1
  ),
  -- New pro subscribers
  new_pro AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(*) as subscriber_count
    FROM subscriptions
    WHERE created_at BETWEEN p_start_date AND v_end_date
      AND tier = 'pro'
    GROUP BY 1
  ),
  -- Revenue
  revenue AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      SUM(amount) as total
    FROM payments
    WHERE created_at BETWEEN p_start_date AND v_end_date
      AND status = 'succeeded'
    GROUP BY 1
  ),
  -- Smart links created
  links_created AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(*) as link_count
    FROM smart_links
    WHERE created_at BETWEEN p_start_date AND v_end_date
    GROUP BY 1
  ),
  -- Social assets created
  social_assets AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(*) as asset_count
    FROM analytics_events
    WHERE created_at BETWEEN p_start_date AND v_end_date
      AND event_type = 'social_asset_created'
    GROUP BY 1
  ),
  -- Meta pixels added
  meta_pixels AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(*) as pixel_count
    FROM smart_links
    WHERE created_at BETWEEN p_start_date AND v_end_date
      AND meta_pixel_id IS NOT NULL
    GROUP BY 1
  ),
  -- Email capture enabled
  email_capture AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(*) as capture_count
    FROM smart_links
    WHERE created_at BETWEEN p_start_date AND v_end_date
      AND email_capture_enabled = TRUE
    GROUP BY 1
  )
  SELECT
    'current'::TEXT as period,
    d.day,
    COALESCE(pv.view_count, 0) as product_page_views,
    COALESCE(slv.view_count, 0) as smart_link_views,
    COALESCE(v.visitor_count, 0) as unique_visitors,
    COALESCE(nu.user_count, 0) as registered_users,
    COALESCE(au.user_count, 0) as active_users,
    COALESCE(np.subscriber_count, 0) as pro_subscribers,
    COALESCE(r.total, 0) as total_revenue,
    COALESCE(lc.link_count, 0) as smart_links_created,
    COALESCE(sa.asset_count, 0) as social_assets_created,
    COALESCE(mp.pixel_count, 0) as meta_pixels_added,
    COALESCE(ec.capture_count, 0) as email_capture_enabled
  FROM dates d
  LEFT JOIN product_views pv ON pv.day = d.day
  LEFT JOIN smart_link_views slv ON slv.day = d.day
  LEFT JOIN visitors v ON v.day = d.day
  LEFT JOIN new_users nu ON nu.day = d.day
  LEFT JOIN active_users au ON au.day = d.day
  LEFT JOIN new_pro np ON np.day = d.day
  LEFT JOIN revenue r ON r.day = d.day
  LEFT JOIN links_created lc ON lc.day = d.day
  LEFT JOIN social_assets sa ON sa.day = d.day
  LEFT JOIN meta_pixels mp ON mp.day = d.day
  LEFT JOIN email_capture ec ON ec.day = d.day

  UNION ALL

  -- Previous period data (for trend calculation)
  SELECT
    'previous'::TEXT as period,
    date_trunc('day', dd)::date AS day,
    COALESCE((
      SELECT COUNT(DISTINCT session_id) 
      FROM analytics_page_views 
      WHERE date_trunc('day', created_at)::date = date_trunc('day', dd)::date
        AND url NOT LIKE '%/link/%'
        AND session_id IS NOT NULL
    ), 0) as product_page_views,
    COALESCE((
      SELECT COUNT(*) 
      FROM link_views 
      WHERE date_trunc('day', viewed_at)::date = date_trunc('day', dd)::date
    ), 0) as smart_link_views,
    COALESCE((
      SELECT COUNT(DISTINCT session_id) 
      FROM analytics_page_views 
      WHERE date_trunc('day', created_at)::date = date_trunc('day', dd)::date
        AND url NOT LIKE '%/link/%'
        AND session_id IS NOT NULL
    ), 0) as unique_visitors,
    COALESCE((
      SELECT COUNT(*) 
      FROM auth.users 
      WHERE date_trunc('day', created_at)::date = date_trunc('day', dd)::date
    ), 0) as registered_users,
    COALESCE((
      SELECT COUNT(DISTINCT user_id) 
      FROM analytics_events 
      WHERE date_trunc('day', created_at)::date = date_trunc('day', dd)::date
        AND user_id IS NOT NULL
        AND event_type = 'login'
    ), 0) as active_users,
    COALESCE((
      SELECT COUNT(*) 
      FROM subscriptions 
      WHERE date_trunc('day', created_at)::date = date_trunc('day', dd)::date
        AND tier = 'pro'
    ), 0) as pro_subscribers,
    COALESCE((
      SELECT SUM(amount) 
      FROM payments 
      WHERE date_trunc('day', created_at)::date = date_trunc('day', dd)::date
        AND status = 'succeeded'
    ), 0) as total_revenue,
    COALESCE((
      SELECT COUNT(*) 
      FROM smart_links 
      WHERE date_trunc('day', created_at)::date = date_trunc('day', dd)::date
    ), 0) as smart_links_created,
    COALESCE((
      SELECT COUNT(*) 
      FROM analytics_events 
      WHERE date_trunc('day', created_at)::date = date_trunc('day', dd)::date
        AND event_type = 'social_asset_created'
    ), 0) as social_assets_created,
    COALESCE((
      SELECT COUNT(*) 
      FROM smart_links 
      WHERE date_trunc('day', created_at)::date = date_trunc('day', dd)::date
        AND meta_pixel_id IS NOT NULL
    ), 0) as meta_pixels_added,
    COALESCE((
      SELECT COUNT(*) 
      FROM smart_links 
      WHERE date_trunc('day', created_at)::date = date_trunc('day', dd)::date
        AND email_capture_enabled = TRUE
    ), 0) as email_capture_enabled
  FROM generate_series(
    v_prev_start_date::date,
    v_prev_end_date::date,
    '1 day'::interval
  ) dd;
END;
$$;

-- Re-grant execute permissions on the updated functions
GRANT EXECUTE ON FUNCTION get_analytics_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_improved_analytics_stats TO authenticated;
