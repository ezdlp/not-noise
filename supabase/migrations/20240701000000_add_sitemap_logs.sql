
-- Create sitemap_logs table to track sitemap generation events
CREATE TABLE IF NOT EXISTS sitemap_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for efficient retrieval of recent logs
CREATE INDEX IF NOT EXISTS sitemap_logs_created_at_idx ON sitemap_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS sitemap_logs_status_idx ON sitemap_logs (status);

-- Add RLS policy for sitemap_logs
ALTER TABLE sitemap_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to sitemap_logs
CREATE POLICY "Service role has full access to sitemap_logs"
ON sitemap_logs
USING (true)
WITH CHECK (true);

-- Create trigger to update the updated_at column automatically
CREATE TRIGGER update_sitemap_logs_updated_at
BEFORE UPDATE ON sitemap_logs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
