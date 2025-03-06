-- Fix analytics functions to use real data instead of dummy data
-- Created: 2024-07-01

-- Function to get analytics stats with real data
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
  
  -- Return combined results from current and previous periods
  RETURN QUERY
  
  -- Current period data
  SELECT
    'current'::TEXT as period,
    day::DATE,
    product_page_views,
    smart_link_views,
    unique_visitors,
    registered_users,
    active_users,
    pro_subscribers,
    total_revenue,
    smart_links_created,
    social_assets_created,
    meta_pixels_added,
    email_capture_enabled
  FROM (
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
    -- Pro subscribers (count active subscriptions by day)
    pro_subscribers AS (
      SELECT 
        date_trunc('day', dd)::date AS day,
        COUNT(DISTINCT user_id) as subscriber_count
      FROM generate_series(
        p_start_date::date,
        v_end_date::date,
        '1 day'::interval
      ) dd
      CROSS JOIN (
        SELECT 
          user_id, 
          created_at, 
          COALESCE(updated_at, CURRENT_TIMESTAMP) as end_date
        FROM subscriptions
        WHERE tier = 'pro' 
        AND status = 'active'
      ) s
      WHERE dd BETWEEN s.created_at AND s.end_date
      GROUP BY 1
    ),
    -- Revenue (estimated from subscriptions)
    revenue AS (
      SELECT 
        date_trunc('day', created_at)::date AS day,
        -- Monthly subscriptions are $9.99, yearly are $99.99
        SUM(
          CASE 
            WHEN billing_period = 'month' THEN 9.99
            WHEN billing_period = 'year' THEN 99.99
            ELSE 0
          END
        ) as total
      FROM subscriptions
      WHERE created_at BETWEEN p_start_date AND v_end_date
        AND tier = 'pro'
        AND status = 'active'
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
      FROM social_media_assets
      WHERE created_at BETWEEN p_start_date AND v_end_date
      GROUP BY 1
    ),
    -- Meta pixels added
    meta_pixels AS (
      SELECT 
        date_trunc('day', COALESCE(meta_pixel_added_at, created_at))::date AS day,
        COUNT(*) as pixel_count
      FROM smart_links
      WHERE COALESCE(meta_pixel_added_at, created_at) BETWEEN p_start_date AND v_end_date
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
      d.day,
      COALESCE(pv.view_count, 0) as product_page_views,
      COALESCE(slv.view_count, 0) as smart_link_views,
      COALESCE(v.visitor_count, 0) as unique_visitors,
      COALESCE(nu.user_count, 0) as registered_users,
      COALESCE(au.user_count, 0) as active_users,
      COALESCE(ps.subscriber_count, 0) as pro_subscribers,
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
    LEFT JOIN pro_subscribers ps ON ps.day = d.day
    LEFT JOIN revenue r ON r.day = d.day
    LEFT JOIN links_created lc ON lc.day = d.day
    LEFT JOIN social_assets sa ON sa.day = d.day
    LEFT JOIN meta_pixels mp ON mp.day = d.day
    LEFT JOIN email_capture ec ON ec.day = d.day
  ) current_data

  UNION ALL

  -- Previous period data (for trend calculation)
  SELECT
    'previous'::TEXT as period,
    day::DATE,
    product_page_views,
    smart_link_views,
    unique_visitors,
    registered_users,
    active_users,
    pro_subscribers,
    total_revenue,
    smart_links_created,
    social_assets_created,
    meta_pixels_added,
    email_capture_enabled
  FROM (
    WITH dates AS (
      SELECT 
        date_trunc('day', dd)::date AS day
      FROM generate_series(
        v_prev_start_date::date,
        v_prev_end_date::date,
        '1 day'::interval
      ) dd
    ),
    -- Product page views (excluding /link/ paths)
    product_views AS (
      SELECT 
        date_trunc('day', created_at)::date AS day,
        COUNT(*) as view_count
      FROM analytics_page_views
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date
        AND url NOT LIKE '%/link/%'
      GROUP BY 1
    ),
    -- Smart link views (only /link/ paths)
    smart_link_views AS (
      SELECT 
        date_trunc('day', viewed_at)::date AS day,
        COUNT(*) as view_count
      FROM link_views
      WHERE viewed_at BETWEEN v_prev_start_date AND v_prev_end_date
      GROUP BY 1
    ),
    -- Unique visitors
    visitors AS (
      SELECT 
        date_trunc('day', created_at)::date AS day,
        COUNT(DISTINCT session_id) as visitor_count
      FROM analytics_page_views
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date
        AND url NOT LIKE '%/link/%'
      GROUP BY 1
    ),
    -- New registered users
    new_users AS (
      SELECT 
        date_trunc('day', created_at)::date AS day,
        COUNT(*) as user_count
      FROM auth.users
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date
      GROUP BY 1
    ),
    -- Active users (users who logged in)
    active_users AS (
      SELECT 
        date_trunc('day', created_at)::date AS day,
        COUNT(DISTINCT user_id) as user_count
      FROM analytics_events
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date
        AND user_id IS NOT NULL
        AND event_type = 'login'
      GROUP BY 1
    ),
    -- Pro subscribers (count active subscriptions by day)
    pro_subscribers AS (
      SELECT 
        date_trunc('day', dd)::date AS day,
        COUNT(DISTINCT user_id) as subscriber_count
      FROM generate_series(
        v_prev_start_date::date,
        v_prev_end_date::date,
        '1 day'::interval
      ) dd
      CROSS JOIN (
        SELECT 
          user_id, 
          created_at, 
          COALESCE(updated_at, CURRENT_TIMESTAMP) as end_date
        FROM subscriptions
        WHERE tier = 'pro' 
        AND status = 'active'
      ) s
      WHERE dd BETWEEN s.created_at AND s.end_date
      GROUP BY 1
    ),
    -- Revenue (estimated from subscriptions)
    revenue AS (
      SELECT 
        date_trunc('day', created_at)::date AS day,
        -- Monthly subscriptions are $9.99, yearly are $99.99
        SUM(
          CASE 
            WHEN billing_period = 'month' THEN 9.99
            WHEN billing_period = 'year' THEN 99.99
            ELSE 0
          END
        ) as total
      FROM subscriptions
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date
        AND tier = 'pro'
        AND status = 'active'
      GROUP BY 1
    ),
    -- Smart links created
    links_created AS (
      SELECT 
        date_trunc('day', created_at)::date AS day,
        COUNT(*) as link_count
      FROM smart_links
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date
      GROUP BY 1
    ),
    -- Social assets created
    social_assets AS (
      SELECT 
        date_trunc('day', created_at)::date AS day,
        COUNT(*) as asset_count
      FROM social_media_assets
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date
      GROUP BY 1
    ),
    -- Meta pixels added
    meta_pixels AS (
      SELECT 
        date_trunc('day', COALESCE(meta_pixel_added_at, created_at))::date AS day,
        COUNT(*) as pixel_count
      FROM smart_links
      WHERE COALESCE(meta_pixel_added_at, created_at) BETWEEN v_prev_start_date AND v_prev_end_date
        AND meta_pixel_id IS NOT NULL
      GROUP BY 1
    ),
    -- Email capture enabled
    email_capture AS (
      SELECT 
        date_trunc('day', created_at)::date AS day,
        COUNT(*) as capture_count
      FROM smart_links
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date
        AND email_capture_enabled = TRUE
      GROUP BY 1
    )
    SELECT
      d.day,
      COALESCE(pv.view_count, 0) as product_page_views,
      COALESCE(slv.view_count, 0) as smart_link_views,
      COALESCE(v.visitor_count, 0) as unique_visitors,
      COALESCE(nu.user_count, 0) as registered_users,
      COALESCE(au.user_count, 0) as active_users,
      COALESCE(ps.subscriber_count, 0) as pro_subscribers,
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
    LEFT JOIN pro_subscribers ps ON ps.day = d.day
    LEFT JOIN revenue r ON r.day = d.day
    LEFT JOIN links_created lc ON lc.day = d.day
    LEFT JOIN social_assets sa ON sa.day = d.day
    LEFT JOIN meta_pixels mp ON mp.day = d.day
    LEFT JOIN email_capture ec ON ec.day = d.day
  ) previous_data;
END;
$$;

-- Function to get monthly active users for the last 5 months
CREATE OR REPLACE FUNCTION get_monthly_active_users()
RETURNS TABLE (
  month TEXT,
  active_users BIGINT,
  pro_users BIGINT,
  total_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT 
      to_char(date_trunc('month', m), 'Mon YYYY') as month,
      date_trunc('month', m) as month_start,
      date_trunc('month', m) + interval '1 month' - interval '1 day' as month_end
    FROM generate_series(
      date_trunc('month', current_date) - interval '4 months',
      date_trunc('month', current_date),
      interval '1 month'
    ) m
  ),
  active_users AS (
    SELECT 
      date_trunc('month', created_at) as month,
      COUNT(DISTINCT user_id) as user_count
    FROM analytics_events
    WHERE created_at >= (date_trunc('month', current_date) - interval '4 months')
      AND user_id IS NOT NULL
      AND event_type = 'login'
    GROUP BY 1
  ),
  pro_users AS (
    -- Count users who had an active pro subscription during each month
    SELECT 
      date_trunc('month', m.month_start) as month,
      COUNT(DISTINCT s.user_id) as user_count
    FROM months m
    JOIN subscriptions s ON 
      (s.created_at <= m.month_end) AND 
      (s.updated_at IS NULL OR s.updated_at >= m.month_start)
    WHERE s.tier = 'pro' 
      AND s.status = 'active'
    GROUP BY 1
  ),
  total_users AS (
    SELECT 
      date_trunc('month', m.month_start) as month,
      COUNT(DISTINCT u.id) as user_count
    FROM months m
    JOIN auth.users u ON u.created_at <= m.month_end
    GROUP BY 1
  )
  SELECT 
    m.month,
    COALESCE(au.user_count, 0) as active_users,
    COALESCE(pu.user_count, 0) as pro_users,
    COALESCE(tu.user_count, 0) as total_users
  FROM months m
  LEFT JOIN active_users au ON au.month = m.month_start
  LEFT JOIN pro_users pu ON pu.month = m.month_start
  LEFT JOIN total_users tu ON tu.month = m.month_start
  ORDER BY m.month_start;
END;
$$;

-- Function to get pro feature usage statistics
CREATE OR REPLACE FUNCTION get_pro_feature_usage()
RETURNS TABLE (
  feature TEXT,
  count BIGINT,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_pro_users BIGINT;
BEGIN
  -- Get total number of pro users
  SELECT COUNT(DISTINCT user_id) INTO total_pro_users
  FROM subscriptions
  WHERE tier = 'pro' AND status = 'active';
  
  -- Return feature usage stats
  RETURN QUERY
  WITH features AS (
    -- Social assets
    SELECT 
      'Social Assets' as feature,
      COUNT(DISTINCT sl.user_id) as user_count
    FROM social_media_assets sma
    JOIN smart_links sl ON sl.id = sma.smart_link_id
    WHERE sl.user_id IN (
      SELECT user_id FROM subscriptions WHERE tier = 'pro' AND status = 'active'
    )
    
    UNION ALL
    
    -- Meta pixels
    SELECT 
      'Meta Pixels' as feature,
      COUNT(DISTINCT user_id) as user_count
    FROM smart_links
    WHERE meta_pixel_id IS NOT NULL
      AND user_id IN (
        SELECT user_id FROM subscriptions WHERE tier = 'pro' AND status = 'active'
      )
    
    UNION ALL
    
    -- Email capture
    SELECT 
      'Email Capture' as feature,
      COUNT(DISTINCT user_id) as user_count
    FROM smart_links
    WHERE email_capture_enabled = TRUE
      AND user_id IN (
        SELECT user_id FROM subscriptions WHERE tier = 'pro' AND status = 'active'
      )
  )
  SELECT 
    f.feature,
    f.user_count as count,
    CASE 
      WHEN total_pro_users > 0 THEN (f.user_count::numeric / total_pro_users) * 100
      ELSE 0
    END as percentage
  FROM features f;
END;
$$;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION get_improved_analytics_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_active_users TO authenticated;
GRANT EXECUTE ON FUNCTION get_pro_feature_usage TO authenticated; 