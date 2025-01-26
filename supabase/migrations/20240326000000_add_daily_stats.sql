CREATE OR REPLACE FUNCTION get_daily_stats(p_smart_link_id UUID, p_start_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
  day DATE,
  views BIGINT,
  clicks BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH dates AS (
    SELECT date_trunc('day', dd)::date AS day
    FROM generate_series(
      p_start_date::date,
      CURRENT_DATE,
      '1 day'::interval
    ) dd
  ),
  views AS (
    SELECT 
      date_trunc('day', viewed_at)::date AS day,
      COUNT(*) as view_count
    FROM link_views
    WHERE smart_link_id = p_smart_link_id
    AND viewed_at >= p_start_date
    GROUP BY 1
  ),
  clicks AS (
    SELECT 
      date_trunc('day', c.clicked_at)::date AS day,
      COUNT(*) as click_count
    FROM platform_clicks c
    JOIN platform_links pl ON pl.id = c.platform_link_id
    WHERE pl.smart_link_id = p_smart_link_id
    AND c.clicked_at >= p_start_date
    GROUP BY 1
  )
  SELECT 
    d.day,
    COALESCE(v.view_count, 0) as views,
    COALESCE(c.click_count, 0) as clicks
  FROM dates d
  LEFT JOIN views v ON v.day = d.day
  LEFT JOIN clicks c ON c.day = d.day
  ORDER BY d.day;
END;
$$;

-- Add RLS policy to allow access to the function
GRANT EXECUTE ON FUNCTION get_daily_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_stats TO anon;