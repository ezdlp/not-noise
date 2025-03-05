-- Create sitemap_cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sitemap_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  etag TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sitemap_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sitemap_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS sitemap_cache_key_idx ON public.sitemap_cache (key);
CREATE INDEX IF NOT EXISTS sitemap_logs_status_idx ON public.sitemap_logs (status);
CREATE INDEX IF NOT EXISTS sitemap_logs_source_idx ON public.sitemap_logs (source);

-- Enable RLS but make the tables accessible to authenticated users
ALTER TABLE public.sitemap_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sitemap_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for sitemap_cache
CREATE POLICY "Allow service role full access to sitemap_cache"
  ON public.sitemap_cache
  USING (true)
  WITH CHECK (true);

-- Create policies for sitemap_logs
CREATE POLICY "Allow service role full access to sitemap_logs"
  ON public.sitemap_logs
  USING (true)
  WITH CHECK (true); 