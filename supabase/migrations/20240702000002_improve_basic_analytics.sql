
-- Enhance the basic analytics stats function with better error handling

CREATE OR REPLACE FUNCTION public.get_basic_analytics_stats(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  period TEXT,
  day DATE,
  product_page_views BIGINT,
  smart_link_views BIGINT,
  unique_visitors BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_end_date TIMESTAMP WITH TIME ZONE;
  v_prev_start_date TIMESTAMP WITH TIME ZONE;
  v_prev_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set statement timeout to 10 seconds - this should be quick
  SET LOCAL statement_timeout = '10s';
  
  -- Set end date if not provided
  v_end_date := COALESCE(p_end_date, CURRENT_TIMESTAMP);
  
  -- Calculate previous period dates
  v_prev_end_date := p_start_date - INTERVAL '1 day';
  v_prev_start_date := v_prev_end_date - (v_end_date - p_start_date);
  
  -- Return only the essential metrics with properly constructed data
  RETURN QUERY
  
  -- Create dates for both periods
  WITH current_dates AS (
    SELECT date_trunc('day', dd)::date AS day, 'current'::TEXT as period
    FROM generate_series(p_start_date::date, v_end_date::date, '1 day'::interval) dd
  ),
  previous_dates AS (
    SELECT date_trunc('day', dd)::date AS day, 'previous'::TEXT as period
    FROM generate_series(v_prev_start_date::date, v_prev_end_date::date, '1 day'::interval) dd
  ),
  all_dates AS (
    SELECT * FROM current_dates
    UNION ALL
    SELECT * FROM previous_dates
  ),
  
  -- Pre-aggregate metrics for better performance
  product_views AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      CASE 
        WHEN created_at BETWEEN p_start_date AND v_end_date THEN 'current'
        WHEN created_at BETWEEN v_prev_start_date AND v_prev_end_date THEN 'previous'
      END as period,
      COUNT(*) as view_count
    FROM analytics_page_views
    WHERE created_at BETWEEN v_prev_start_date AND v_end_date
      AND url NOT LIKE '%/link/%'
    GROUP BY 1, 2
  ),
  
  smart_link_views AS (
    SELECT 
      date_trunc('day', viewed_at)::date AS day,
      CASE 
        WHEN viewed_at BETWEEN p_start_date AND v_end_date THEN 'current'
        WHEN viewed_at BETWEEN v_prev_start_date AND v_prev_end_date THEN 'previous'
      END as period,
      COUNT(*) as view_count
    FROM link_views
    WHERE viewed_at BETWEEN v_prev_start_date AND v_end_date
    GROUP BY 1, 2
  ),
  
  unique_visitors AS (
    SELECT 
      date_trunc('day', created_at)::date AS day,
      CASE 
        WHEN created_at BETWEEN p_start_date AND v_end_date THEN 'current'
        WHEN created_at BETWEEN v_prev_start_date AND v_prev_end_date THEN 'previous'
      END as period,
      COUNT(DISTINCT session_id) as visitor_count
    FROM analytics_page_views
    WHERE created_at BETWEEN v_prev_start_date AND v_end_date
      AND url NOT LIKE '%/link/%'
    GROUP BY 1, 2
  )
  
  -- Join all data
  SELECT 
    d.period,
    d.day,
    COALESCE(pv.view_count, 0) as product_page_views,
    COALESCE(slv.view_count, 0) as smart_link_views,
    COALESCE(uv.visitor_count, 0) as unique_visitors
  FROM all_dates d
  LEFT JOIN product_views pv ON pv.day = d.day AND pv.period = d.period
  LEFT JOIN smart_link_views slv ON slv.day = d.day AND slv.period = d.period
  LEFT JOIN unique_visitors uv ON uv.day = d.day AND uv.period = d.period
  ORDER BY d.period, d.day;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_basic_analytics_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
