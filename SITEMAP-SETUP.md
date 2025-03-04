# Sitemap Setup

This document outlines the setup and configuration of the sitemap generation system for the website.

## Overview

The sitemap system uses a Supabase Edge Function (`simplified-sitemap`) to generate and serve XML sitemaps for the website. The sitemaps are cached in a Supabase database table to improve performance.

## Components

1. **Supabase Edge Function**: `simplified-sitemap` - Handles both generation and serving of sitemaps
2. **Database Tables**:
   - `sitemap_cache` - Stores the generated sitemap XML content
   - `sitemap_logs` - Logs sitemap generation events

## URLs

The sitemap is accessible at the following URLs:

- Main sitemap index: `https://soundraiser.io/sitemap.xml`
- Individual sitemaps:
  - `https://soundraiser.io/sitemap-static.xml`
  - `https://soundraiser.io/sitemap-blog.xml`
  - `https://soundraiser.io/sitemap-links-1.xml` (and potentially more numbered link sitemaps)

## Regeneration

The sitemap automatically regenerates when:
1. It doesn't exist in the cache
2. It's older than 24 hours

To manually force regeneration, access:
```
https://soundraiser.io/api/sitemap?regenerate=true
```

## Vercel Configuration

Vercel rewrites are configured to route sitemap requests to the Supabase function. See [vercel-rewrites.md](./vercel-rewrites.md) for the configuration details.

## Deployment

The function is deployed using GitHub Actions. The workflow file is located at `.github/workflows/deploy-sitemap-functions.yml`.

## Troubleshooting

If the sitemap is not working correctly:

1. Check if the function is accessible directly:
   ```
   https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/simplified-sitemap
   ```

2. Check if regeneration works:
   ```
   https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/simplified-sitemap?regenerate=true
   ```

3. Verify the database tables exist and contain data:
   - `sitemap_cache`
   - `sitemap_logs`

4. Check the Vercel rewrites configuration

## Migration from Old System

The new simplified sitemap system replaces the previous multi-function approach. After confirming the new system works correctly, the old function files can be removed:

- `supabase/functions/sitemap/`
- `supabase/functions/sitemap-file/`
- `supabase/functions/sitemap-generator/`
- `supabase/functions/sitemap-cache/`
- `supabase/functions/sitemap-health/`
- `supabase/functions/regenerate-sitemap/`

Also update:
- `supabase/config.toml` to remove old function configurations
- `.github/workflows/deploy-sitemap-functions.yml` to remove old function deployments 