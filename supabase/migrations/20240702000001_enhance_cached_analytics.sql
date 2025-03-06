
-- This migration enhances the cached analytics function with improved diagnostics and error handling

-- Enhance the get_cached_analytics_stats function to better handle fallbacks and diagnostics
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
  v_full_stats JSONB;
  v_basic_stats JSONB;
  v_error_details JSONB;
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
  
  -- Try to get data from the primary function
  BEGIN
    SELECT json_agg(row_to_json(stats))::jsonb INTO v_full_stats
    FROM get_improved_analytics_stats(p_start_date, v_end_date) stats;
    
    -- If the full stats function succeeded
    IF v_full_stats IS NOT NULL AND v_full_stats != '[]'::jsonb THEN
      -- Store in cache
      INSERT INTO analytics_cache (cache_key, cache_data, expires_at)
      VALUES (v_cache_key, v_full_stats, now() + (p_cache_minutes * interval '1 minute'))
      ON CONFLICT (cache_key) 
      DO UPDATE SET 
        cache_data = v_full_stats,
        expires_at = now() + (p_cache_minutes * interval '1 minute');
      
      -- Update log with success status
      UPDATE analytics_function_logs
      SET 
        end_time = CURRENT_TIMESTAMP,
        duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000,
        status = 'success',
        details = jsonb_build_object('source', 'full_stats')
      WHERE id = v_log_id;
      
      RETURN v_full_stats;
    END IF;
    
    -- Log that full stats returned no results
    v_error_details := jsonb_build_object(
      'message', 'Full stats function returned no results',
      'data', v_full_stats
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Capture error details
    v_error_details := jsonb_build_object(
      'message', SQLERRM,
      'state', SQLSTATE,
      'context', 'full_stats_function'
    );
  END;
  
  -- Try the fallback function
  BEGIN
    SELECT json_agg(row_to_json(stats))::jsonb INTO v_basic_stats
    FROM get_basic_analytics_stats(p_start_date, v_end_date) stats;
    
    -- Update log with fallback status
    UPDATE analytics_function_logs
    SET 
      end_time = CURRENT_TIMESTAMP,
      duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000,
      status = 'fallback',
      details = jsonb_build_object(
        'full_stats_error', v_error_details,
        'fallback_data', v_basic_stats
      )
    WHERE id = v_log_id;
    
    -- Store in cache
    INSERT INTO analytics_cache (cache_key, cache_data, expires_at)
    VALUES (v_cache_key, v_basic_stats, now() + (p_cache_minutes * interval '1 minute'))
    ON CONFLICT (cache_key) 
    DO UPDATE SET 
      cache_data = v_basic_stats,
      expires_at = now() + (p_cache_minutes * interval '1 minute');
    
    RETURN v_basic_stats;
    
  EXCEPTION WHEN OTHERS THEN
    -- Both functions failed, log the error
    UPDATE analytics_function_logs
    SET 
      end_time = CURRENT_TIMESTAMP,
      duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000,
      status = 'error',
      details = jsonb_build_object(
        'full_stats_error', v_error_details,
        'basic_stats_error', jsonb_build_object(
          'message', SQLERRM,
          'state', SQLSTATE,
          'context', 'basic_stats_function'
        )
      )
    WHERE id = v_log_id;
    
    -- Return an empty array rather than throwing an error
    RETURN '[]'::jsonb;
  END;
END;
$$;

-- Create a function logs table for diagnostics if it doesn't exist
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

-- Create an index for faster querying of logs
CREATE INDEX IF NOT EXISTS idx_analytics_function_logs_function_name ON analytics_function_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_analytics_function_logs_status ON analytics_function_logs(status);
CREATE INDEX IF NOT EXISTS idx_analytics_function_logs_start_time ON analytics_function_logs(start_time);

-- Function to get the latest analytics function logs
CREATE OR REPLACE FUNCTION public.get_analytics_function_logs(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  function_name TEXT,
  parameters JSONB,
  status TEXT,
  details JSONB,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_ms NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    logs.id,
    logs.function_name,
    logs.parameters,
    logs.status,
    logs.details,
    logs.start_time,
    logs.end_time,
    logs.duration_ms,
    logs.created_at
  FROM analytics_function_logs logs
  ORDER BY logs.start_time DESC
  LIMIT p_limit;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_analytics_function_logs(INTEGER) TO authenticated;
