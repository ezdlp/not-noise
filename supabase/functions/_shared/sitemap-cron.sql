
-- Enable the pg_cron extension if it's not already enabled
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule a job to regenerate the sitemap daily
SELECT cron.schedule(
  'regenerate-sitemap-daily',
  '0 0 * * *', -- Run at midnight every day
  $$
    SELECT
      net.http_post(
        url:='https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/sitemap-generator',
        headers:=json_build_object(
          'Content-Type', 'application/json',
          'x-api-key', (SELECT value FROM app_config WHERE key = 'sitemap_webhook_key')
        )::jsonb,
        body:=json_build_object('source', 'cron', 'timestamp', now())::jsonb
      ) as request_id;
  $$
);
