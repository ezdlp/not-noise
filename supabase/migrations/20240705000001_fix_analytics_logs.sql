
-- Create the analytics_function_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.analytics_function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  parameters JSONB,
  status TEXT,
  details JSONB,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_ms NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_function_logs_function_name ON analytics_function_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_analytics_function_logs_status ON analytics_function_logs(status);
CREATE INDEX IF NOT EXISTS idx_analytics_function_logs_start_time ON analytics_function_logs(start_time);

-- Create a simpler analytics stats function that won't fail
CREATE OR REPLACE FUNCTION public.get_simple_analytics_stats(
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
  v_log_id UUID;
BEGIN
  -- Log function start
  INSERT INTO analytics_function_logs (
    function_name,
    parameters,
    start_time
  ) VALUES (
    'get_simple_analytics_stats',
    jsonb_build_object(
      'p_start_date', p_start_date,
      'p_end_date', p_end_date
    ),
    CURRENT_TIMESTAMP
  ) RETURNING id INTO v_log_id;

  BEGIN
    -- Set timeout to prevent long-running queries
    SET LOCAL statement_timeout = '10s';
    
    -- Set end date if not provided
    v_end_date := COALESCE(p_end_date, CURRENT_TIMESTAMP);
    
    -- Calculate previous period dates
    v_prev_end_date := p_start_date - INTERVAL '1 day';
    v_prev_start_date := v_prev_end_date - (v_end_date - p_start_date);
    
    -- Create dates for both periods
    RETURN QUERY
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
    
    -- Calculate metrics with simpler queries
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

    -- Log success
    UPDATE analytics_function_logs
    SET 
      end_time = CURRENT_TIMESTAMP,
      duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000,
      status = 'success',
      details = jsonb_build_object('message', 'Query executed successfully')
    WHERE id = v_log_id;

  EXCEPTION WHEN OTHERS THEN
    -- Log error
    UPDATE analytics_function_logs
    SET 
      end_time = CURRENT_TIMESTAMP,
      duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000,
      status = 'error',
      details = jsonb_build_object(
        'message', SQLERRM,
        'state', SQLSTATE
      )
    WHERE id = v_log_id;
    
    -- Re-raise the exception
    RAISE;
  END;
END;
$$;

-- Modify the cached analytics function to use the simple stats
CREATE OR REPLACE FUNCTION public.get_cached_analytics_stats(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_cache_minutes INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cache_key TEXT;
  v_end_date TIMESTAMP WITH TIME ZONE;
  v_cache_data JSONB;
  v_result JSONB;
  v_log_id UUID;
BEGIN
  -- Set end date if not provided
  v_end_date := COALESCE(p_end_date, CURRENT_TIMESTAMP);
  
  -- Create a cache key based on the parameters
  v_cache_key := 'analytics_stats:' || 
                 to_char(p_start_date, 'YYYY-MM-DD"T"HH24:MI:SS') || 
                 ':' || 
                 to_char(v_end_date, 'YYYY-MM-DD"T"HH24:MI:SS');
  
  -- Insert a log record to track the request
  INSERT INTO analytics_function_logs (
    function_name,
    parameters,
    start_time
  ) VALUES (
    'get_cached_analytics_stats',
    jsonb_build_object(
      'p_start_date', p_start_date,
      'p_end_date', v_end_date,
      'p_cache_minutes', p_cache_minutes
    ),
    CURRENT_TIMESTAMP
  ) RETURNING id INTO v_log_id;
  
  -- Check if we have a cached result
  SELECT cache_data INTO v_cache_data
  FROM analytics_cache
  WHERE cache_key = v_cache_key
    AND expires_at > now();
  
  -- If we have a cache hit, update log and return cached data
  IF v_cache_data IS NOT NULL THEN
    UPDATE analytics_function_logs
    SET 
      end_time = CURRENT_TIMESTAMP,
      duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000,
      status = 'success',
      details = jsonb_build_object('source', 'cache')
    WHERE id = v_log_id;
    
    RETURN v_cache_data;
  END IF;
  
  -- Use the simple stats function
  BEGIN
    SELECT json_agg(row_to_json(stats))::jsonb INTO v_result
    FROM get_simple_analytics_stats(p_start_date, v_end_date) stats;
    
    -- Store in cache
    INSERT INTO analytics_cache (cache_key, cache_data, expires_at)
    VALUES (v_cache_key, v_result, now() + (p_cache_minutes * interval '1 minute'))
    ON CONFLICT (cache_key) 
    DO UPDATE SET 
      cache_data = v_result,
      expires_at = now() + (p_cache_minutes * interval '1 minute');
    
    -- Update log with success status
    UPDATE analytics_function_logs
    SET 
      end_time = CURRENT_TIMESTAMP,
      duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000,
      status = 'success',
      details = jsonb_build_object('source', 'simple_stats')
    WHERE id = v_log_id;
    
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Update log with error status
    UPDATE analytics_function_logs
    SET 
      end_time = CURRENT_TIMESTAMP,
      duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000,
      status = 'error',
      details = jsonb_build_object(
        'message', SQLERRM,
        'state', SQLSTATE
      )
    WHERE id = v_log_id;
    
    -- Return an empty array rather than throwing an error
    RETURN '[]'::jsonb;
  END;
END;
$$;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION public.get_simple_analytics_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cached_analytics_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_function_logs(INTEGER) TO authenticated;
