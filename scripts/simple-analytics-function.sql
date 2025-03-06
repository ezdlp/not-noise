-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_improved_analytics_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

-- Create a simplified version of the function
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
BEGIN
  -- Set end date to current date if not provided
  v_end_date := COALESCE(p_end_date, CURRENT_TIMESTAMP);
  
  -- Return dummy data for testing
  RETURN QUERY
  WITH dates AS (
    SELECT 
      'current'::TEXT as period,
      date_trunc('day', dd)::date AS day
    FROM generate_series(
      p_start_date::date,
      v_end_date::date,
      '1 day'::interval
    ) dd
  )
  SELECT
    d.period,
    d.day,
    100::BIGINT as product_page_views,
    200::BIGINT as smart_link_views,
    50::BIGINT as unique_visitors,
    10::BIGINT as registered_users,
    20::BIGINT as active_users,
    5::BIGINT as pro_subscribers,
    0::NUMERIC as total_revenue,
    15::BIGINT as smart_links_created,
    8::BIGINT as social_assets_created,
    3::BIGINT as meta_pixels_added,
    2::BIGINT as email_capture_enabled
  FROM dates d
  
  UNION ALL
  
  SELECT
    'previous'::TEXT as period,
    date_trunc('day', dd)::date AS day,
    80::BIGINT as product_page_views,
    150::BIGINT as smart_link_views,
    40::BIGINT as unique_visitors,
    8::BIGINT as registered_users,
    15::BIGINT as active_users,
    4::BIGINT as pro_subscribers,
    0::NUMERIC as total_revenue,
    12::BIGINT as smart_links_created,
    6::BIGINT as social_assets_created,
    2::BIGINT as meta_pixels_added,
    1::BIGINT as email_capture_enabled
  FROM generate_series(
    (p_start_date - (v_end_date - p_start_date))::date,
    (p_start_date - INTERVAL '1 day')::date,
    '1 day'::interval
  ) dd;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_improved_analytics_stats TO authenticated; 