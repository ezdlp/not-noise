-- Update the existing analytics function to fix performance issues
-- This modifies the existing function rather than creating a new one

-- First, create needed indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_created_at ON analytics_page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_link_views_viewed_at ON link_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_smart_links_created_at ON smart_links(created_at);
CREATE INDEX IF NOT EXISTS idx_social_media_assets_created_at ON social_media_assets(created_at);

-- Drop and rebuild the function with optimizations
DROP FUNCTION IF EXISTS get_improved_analytics_stats(timestamp with time zone, timestamp with time zone);

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
  -- Set statement timeout to 30 seconds to prevent long-running queries
  SET LOCAL statement_timeout = '30s';
  
  -- Set end date if not provided
  v_end_date := COALESCE(p_end_date, CURRENT_TIMESTAMP);
  
  -- Calculate period length in days
  v_period_length := EXTRACT(DAY FROM (v_end_date - p_start_date));
  
  -- Calculate previous period dates
  v_prev_end_date := p_start_date - INTERVAL '1 day';
  v_prev_start_date := v_prev_end_date - (v_end_date - p_start_date);
  
  -- Return combined results from current and previous periods
  RETURN QUERY
  
  -- Current period data
  WITH current_stats AS (
    SELECT
      'current'::TEXT as period,
      d.day::DATE,
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
    FROM (
      SELECT date_trunc('day', dd)::date AS day
      FROM generate_series(p_start_date::date, v_end_date::date, '1 day'::interval) dd
    ) d
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*) as view_count
      FROM analytics_page_views
      WHERE created_at BETWEEN p_start_date AND v_end_date AND url NOT LIKE '%/link/%'
      GROUP BY 1
    ) pv ON pv.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', viewed_at)::date AS day, COUNT(*) as view_count
      FROM link_views
      WHERE viewed_at BETWEEN p_start_date AND v_end_date
      GROUP BY 1
    ) slv ON slv.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(DISTINCT session_id) as visitor_count
      FROM analytics_page_views
      WHERE created_at BETWEEN p_start_date AND v_end_date AND url NOT LIKE '%/link/%'
      GROUP BY 1
    ) v ON v.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*) as user_count
      FROM auth.users
      WHERE created_at BETWEEN p_start_date AND v_end_date
      GROUP BY 1
    ) nu ON nu.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(DISTINCT user_id) as user_count
      FROM analytics_events
      WHERE created_at BETWEEN p_start_date AND v_end_date AND user_id IS NOT NULL AND event_type = 'login'
      GROUP BY 1
    ) au ON au.day = d.day
    LEFT JOIN (
      SELECT 
        date_trunc('day', dd)::date AS day,
        COUNT(DISTINCT s.user_id) as subscriber_count
      FROM 
        generate_series(p_start_date::date, v_end_date::date, '1 day'::interval) dd
      CROSS JOIN (
        SELECT user_id, created_at, COALESCE(updated_at, CURRENT_TIMESTAMP) as end_date
        FROM subscriptions
        WHERE tier = 'pro' AND status = 'active'
      ) s
      WHERE dd BETWEEN s.created_at AND s.end_date
      GROUP BY 1
    ) ps ON ps.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created)::date AS day, SUM(amount / 100.0) as total
      FROM stripe_charges
      WHERE created BETWEEN p_start_date AND v_end_date AND status = 'succeeded'
      GROUP BY 1
    ) r ON r.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*) as link_count
      FROM smart_links
      WHERE created_at BETWEEN p_start_date AND v_end_date
      GROUP BY 1
    ) lc ON lc.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*) as asset_count
      FROM social_media_assets
      WHERE created_at BETWEEN p_start_date AND v_end_date
      GROUP BY 1
    ) sa ON sa.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', COALESCE(meta_pixel_added_at, created_at))::date AS day, COUNT(*) as pixel_count
      FROM smart_links
      WHERE COALESCE(meta_pixel_added_at, created_at) BETWEEN p_start_date AND v_end_date AND meta_pixel_id IS NOT NULL
      GROUP BY 1
    ) mp ON mp.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*) as capture_count
      FROM smart_links
      WHERE created_at BETWEEN p_start_date AND v_end_date AND email_capture_enabled = TRUE
      GROUP BY 1
    ) ec ON ec.day = d.day
  ),
  
  -- Previous period data
  previous_stats AS (
    SELECT
      'previous'::TEXT as period,
      d.day::DATE,
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
    FROM (
      SELECT date_trunc('day', dd)::date AS day
      FROM generate_series(v_prev_start_date::date, v_prev_end_date::date, '1 day'::interval) dd
    ) d
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*) as view_count
      FROM analytics_page_views
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date AND url NOT LIKE '%/link/%'
      GROUP BY 1
    ) pv ON pv.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', viewed_at)::date AS day, COUNT(*) as view_count
      FROM link_views
      WHERE viewed_at BETWEEN v_prev_start_date AND v_prev_end_date
      GROUP BY 1
    ) slv ON slv.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(DISTINCT session_id) as visitor_count
      FROM analytics_page_views
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date AND url NOT LIKE '%/link/%'
      GROUP BY 1
    ) v ON v.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*) as user_count
      FROM auth.users
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date
      GROUP BY 1
    ) nu ON nu.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(DISTINCT user_id) as user_count
      FROM analytics_events
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date AND user_id IS NOT NULL AND event_type = 'login'
      GROUP BY 1
    ) au ON au.day = d.day
    LEFT JOIN (
      SELECT 
        date_trunc('day', dd)::date AS day,
        COUNT(DISTINCT s.user_id) as subscriber_count
      FROM 
        generate_series(v_prev_start_date::date, v_prev_end_date::date, '1 day'::interval) dd
      CROSS JOIN (
        SELECT user_id, created_at, COALESCE(updated_at, CURRENT_TIMESTAMP) as end_date
        FROM subscriptions
        WHERE tier = 'pro' AND status = 'active'
      ) s
      WHERE dd BETWEEN s.created_at AND s.end_date
      GROUP BY 1
    ) ps ON ps.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created)::date AS day, SUM(amount / 100.0) as total
      FROM stripe_charges
      WHERE created BETWEEN v_prev_start_date AND v_prev_end_date AND status = 'succeeded'
      GROUP BY 1
    ) r ON r.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*) as link_count
      FROM smart_links
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date
      GROUP BY 1
    ) lc ON lc.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*) as asset_count
      FROM social_media_assets
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date
      GROUP BY 1
    ) sa ON sa.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', COALESCE(meta_pixel_added_at, created_at))::date AS day, COUNT(*) as pixel_count
      FROM smart_links
      WHERE COALESCE(meta_pixel_added_at, created_at) BETWEEN v_prev_start_date AND v_prev_end_date AND meta_pixel_id IS NOT NULL
      GROUP BY 1
    ) mp ON mp.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*) as capture_count
      FROM smart_links
      WHERE created_at BETWEEN v_prev_start_date AND v_prev_end_date AND email_capture_enabled = TRUE
      GROUP BY 1
    ) ec ON ec.day = d.day
  )
  
  -- Combine current and previous stats
  SELECT * FROM current_stats
  UNION ALL
  SELECT * FROM previous_stats;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_improved_analytics_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated; 