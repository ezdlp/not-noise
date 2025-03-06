
-- Add or update the get_analytics_function_logs function to return logs in a consistent format

-- Drop the existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.get_analytics_function_logs(INTEGER);

-- Create the improved function with proper return types
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

-- Ensure the analytics_function_logs table exists and has the right structure
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

-- Make sure the indexes exist
CREATE INDEX IF NOT EXISTS idx_analytics_function_logs_function_name ON analytics_function_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_analytics_function_logs_status ON analytics_function_logs(status);
CREATE INDEX IF NOT EXISTS idx_analytics_function_logs_start_time ON analytics_function_logs(start_time);
