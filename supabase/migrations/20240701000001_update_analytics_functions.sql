-- Function to get analytics stats with improved filtering for product pages vs smart links
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
BEGIN
  -- Set end date to current date if not provided
  v_end_date := COALESCE(p_end_date, CURRENT_TIMESTAMP);
  
  -- Calculate period length in days
  v_period_length := EXTRACT(DAY FROM (v_end_date - p_start_date));
  
  RETURN QUERY
  -- Current period data
  WITH dates AS (
    SELECT 
      'current'::TEXT as period,
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
      COUNT(*) as view_count
    FROM analytics_page_views
    WHERE created_at BETWEEN p_start_date AND v_end_date
      AND url NOT LIKE '%/link/%'
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
    d.period,
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
  WITH dates AS (
    SELECT 
      'previous'::TEXT as period,
      date_trunc('day', dd)::date AS day
    FROM generate_series(
      (p_start_date - (v_period_length || ' days')::interval)::date,
      (p_start_date - '1 day'::interval)::date,
      '1 day'::interval
    ) dd
  ),
  -- Product page views (excluding /link/ paths)
  product_views AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(*) as view_count
    FROM analytics_page_views
    WHERE created_at BETWEEN (p_start_date - (v_period_length || ' days')::interval) AND (p_start_date - '1 day'::interval)
      AND url NOT LIKE '%/link/%'
    GROUP BY 1
  ),
  -- Smart link views (only /link/ paths)
  smart_link_views AS (
    SELECT 
      date_trunc('day', viewed_at)::date AS day,
      COUNT(*) as view_count
    FROM link_views
    WHERE viewed_at BETWEEN (p_start_date - (v_period_length || ' days')::interval) AND (p_start_date - '1 day'::interval)
    GROUP BY 1
  ),
  -- Unique visitors
  visitors AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(DISTINCT session_id) as visitor_count
    FROM analytics_page_views
    WHERE created_at BETWEEN (p_start_date - (v_period_length || ' days')::interval) AND (p_start_date - '1 day'::interval)
      AND url NOT LIKE '%/link/%'
    GROUP BY 1
  ),
  -- New registered users
  new_users AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(*) as user_count
    FROM auth.users
    WHERE created_at BETWEEN (p_start_date - (v_period_length || ' days')::interval) AND (p_start_date - '1 day'::interval)
    GROUP BY 1
  ),
  -- Active users (users who logged in)
  active_users AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(DISTINCT user_id) as user_count
    FROM analytics_events
    WHERE created_at BETWEEN (p_start_date - (v_period_length || ' days')::interval) AND (p_start_date - '1 day'::interval)
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
    WHERE created_at BETWEEN (p_start_date - (v_period_length || ' days')::interval) AND (p_start_date - '1 day'::interval)
      AND tier = 'pro'
    GROUP BY 1
  ),
  -- Revenue
  revenue AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      SUM(amount) as total
    FROM payments
    WHERE created_at BETWEEN (p_start_date - (v_period_length || ' days')::interval) AND (p_start_date - '1 day'::interval)
      AND status = 'succeeded'
    GROUP BY 1
  ),
  -- Smart links created
  links_created AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(*) as link_count
    FROM smart_links
    WHERE created_at BETWEEN (p_start_date - (v_period_length || ' days')::interval) AND (p_start_date - '1 day'::interval)
    GROUP BY 1
  ),
  -- Social assets created
  social_assets AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(*) as asset_count
    FROM analytics_events
    WHERE created_at BETWEEN (p_start_date - (v_period_length || ' days')::interval) AND (p_start_date - '1 day'::interval)
      AND event_type = 'social_asset_created'
    GROUP BY 1
  ),
  -- Meta pixels added
  meta_pixels AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(*) as pixel_count
    FROM smart_links
    WHERE created_at BETWEEN (p_start_date - (v_period_length || ' days')::interval) AND (p_start_date - '1 day'::interval)
      AND meta_pixel_id IS NOT NULL
    GROUP BY 1
  ),
  -- Email capture enabled
  email_capture AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      COUNT(*) as capture_count
    FROM smart_links
    WHERE created_at BETWEEN (p_start_date - (v_period_length || ' days')::interval) AND (p_start_date - '1 day'::interval)
      AND email_capture_enabled = TRUE
    GROUP BY 1
  )
  SELECT 
    d.period,
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
  ORDER BY d.period DESC, d.day;
END;
$$;

-- Add RLS policy to allow access to the function
GRANT EXECUTE ON FUNCTION get_improved_analytics_stats TO authenticated;

-- Function to get monthly active users (MAU)
CREATE OR REPLACE FUNCTION get_monthly_active_users(
  p_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  month TEXT,
  active_users BIGINT,
  pro_users BIGINT,
  total_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set date to current date if not provided
  v_date := COALESCE(p_date, CURRENT_TIMESTAMP);
  
  RETURN QUERY
  WITH months AS (
    SELECT 
      to_char(date_trunc('month', m), 'YYYY-MM') AS month
    FROM generate_series(
      date_trunc('month', v_date - '5 months'::interval),
      date_trunc('month', v_date),
      '1 month'::interval
    ) m
  ),
  -- Active users (users who logged in during the month)
  active_users AS (
    SELECT 
      to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
      COUNT(DISTINCT user_id) as user_count
    FROM analytics_events
    WHERE created_at >= date_trunc('month', v_date - '5 months'::interval)
      AND created_at < date_trunc('month', v_date + '1 month'::interval)
      AND user_id IS NOT NULL
      AND event_type = 'login'
    GROUP BY 1
  ),
  -- Pro users active in the month
  pro_users AS (
    SELECT 
      to_char(date_trunc('month', e.created_at), 'YYYY-MM') AS month,
      COUNT(DISTINCT e.user_id) as user_count
    FROM analytics_events e
    JOIN subscriptions s ON e.user_id = s.user_id
    WHERE e.created_at >= date_trunc('month', v_date - '5 months'::interval)
      AND e.created_at < date_trunc('month', v_date + '1 month'::interval)
      AND e.user_id IS NOT NULL
      AND e.event_type = 'login'
      AND s.tier = 'pro'
      AND s.status = 'active'
    GROUP BY 1
  ),
  -- Total users at the end of each month
  total_users AS (
    SELECT 
      to_char(date_trunc('month', m), 'YYYY-MM') AS month,
      COUNT(*) as user_count
    FROM months m
    CROSS JOIN LATERAL (
      SELECT 1
      FROM auth.users
      WHERE created_at < (date_trunc('month', m) + '1 month'::interval)
    ) u
    GROUP BY 1
  )
  SELECT 
    m.month,
    COALESCE(au.user_count, 0) as active_users,
    COALESCE(pu.user_count, 0) as pro_users,
    COALESCE(tu.user_count, 0) as total_users
  FROM months m
  LEFT JOIN active_users au ON au.month = m.month
  LEFT JOIN pro_users pu ON pu.month = m.month
  LEFT JOIN total_users tu ON tu.month = m.month
  ORDER BY m.month;
END;
$$;

-- Add RLS policy to allow access to the function
GRANT EXECUTE ON FUNCTION get_monthly_active_users TO authenticated;

-- Function to get pro feature usage stats
CREATE OR REPLACE FUNCTION get_pro_feature_usage(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  feature TEXT,
  usage_count BIGINT,
  user_count BIGINT,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_end_date TIMESTAMP WITH TIME ZONE;
  v_total_pro_users BIGINT;
BEGIN
  -- Set end date to current date if not provided
  v_end_date := COALESCE(p_end_date, CURRENT_TIMESTAMP);
  
  -- Get total number of pro users
  SELECT COUNT(DISTINCT user_id) INTO v_total_pro_users
  FROM subscriptions
  WHERE tier = 'pro'
    AND status = 'active'
    AND created_at <= v_end_date;
  
  RETURN QUERY
  -- Social Assets
  SELECT 
    'Social Assets'::TEXT as feature,
    COUNT(*) as usage_count,
    COUNT(DISTINCT user_id) as user_count,
    CASE 
      WHEN v_total_pro_users > 0 THEN 
        ROUND((COUNT(DISTINCT user_id)::NUMERIC / v_total_pro_users) * 100, 2)
      ELSE 0
    END as percentage
  FROM analytics_events
  WHERE created_at BETWEEN p_start_date AND v_end_date
    AND event_type = 'social_asset_created'
    
  UNION ALL
  
  -- Meta Pixels
  SELECT 
    'Meta Pixels'::TEXT as feature,
    COUNT(*) as usage_count,
    COUNT(DISTINCT user_id) as user_count,
    CASE 
      WHEN v_total_pro_users > 0 THEN 
        ROUND((COUNT(DISTINCT user_id)::NUMERIC / v_total_pro_users) * 100, 2)
      ELSE 0
    END as percentage
  FROM smart_links
  WHERE created_at BETWEEN p_start_date AND v_end_date
    AND meta_pixel_id IS NOT NULL
    
  UNION ALL
  
  -- Email Capture
  SELECT 
    'Email Capture'::TEXT as feature,
    COUNT(*) as usage_count,
    COUNT(DISTINCT user_id) as user_count,
    CASE 
      WHEN v_total_pro_users > 0 THEN 
        ROUND((COUNT(DISTINCT user_id)::NUMERIC / v_total_pro_users) * 100, 2)
      ELSE 0
    END as percentage
  FROM smart_links
  WHERE created_at BETWEEN p_start_date AND v_end_date
    AND email_capture_enabled = TRUE;
END;
$$;

-- Add RLS policy to allow access to the function
GRANT EXECUTE ON FUNCTION get_pro_feature_usage TO authenticated; 