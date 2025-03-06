-- Fix ambiguous day column reference in get_improved_analytics_stats function
-- Created: 2025-03-06

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
    curr.day::DATE,
    curr.product_page_views,
    curr.smart_link_views,
    curr.unique_visitors,
    curr.registered_users,
    curr.active_users,
    curr.pro_subscribers,
    curr.total_revenue,
    curr.smart_links_created,
    curr.social_assets_created,
    curr.meta_pixels_added,
    curr.email_capture_enabled
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
            WHEN billing_period = 'monthly' THEN 9.99
            WHEN billing_period = 'annual' THEN 99.99
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
    -- Email capture enabled - Fixed ambiguous column reference by using table alias
    email_capture AS (
      SELECT 
        date_trunc('day', sl.created_at)::date AS day,
        COUNT(*) as capture_count
      FROM smart_links sl
      WHERE sl.created_at BETWEEN p_start_date AND v_end_date
        AND sl.email_capture_enabled = TRUE
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
  ) curr

  UNION ALL

  -- Previous period data (for trend calculation)
  SELECT
    'previous'::TEXT as period,
    prev.day::DATE,
    prev.product_page_views,
    prev.smart_link_views,
    prev.unique_visitors,
    prev.registered_users,
    prev.active_users,
    prev.pro_subscribers,
    prev.total_revenue,
    prev.smart_links_created,
    prev.social_assets_created,
    prev.meta_pixels_added,
    prev.email_capture_enabled
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
            WHEN billing_period = 'monthly' THEN 9.99
            WHEN billing_period = 'annual' THEN 99.99
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
    -- Email capture enabled - Fixed ambiguous column reference by using table alias
    email_capture AS (
      SELECT 
        date_trunc('day', sl.created_at)::date AS day,
        COUNT(*) as capture_count
      FROM smart_links sl
      WHERE sl.created_at BETWEEN v_prev_start_date AND v_prev_end_date
        AND sl.email_capture_enabled = TRUE
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
  ) prev;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_improved_analytics_stats TO authenticated; 