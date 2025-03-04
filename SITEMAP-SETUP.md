# Sitemap Setup and Migration Plan

## Current Situation

The current sitemap implementation consists of 5 separate edge functions:

1. `sitemap` - Serves the sitemap index
2. `sitemap-file` - Serves individual sitemap files
3. `sitemap-generator` - Generates sitemap files
4. `sitemap-cache` - Manages the sitemap cache
5. `sitemap-health` - Monitors sitemap health

This complex setup has led to issues with JWT verification being re-enabled after deployments, making the sitemap inaccessible to search engines.

## New Simplified Solution

A new, simplified sitemap solution has been implemented:

1. `simplified-sitemap` - A single edge function that handles all sitemap functionality:
   - Serving the sitemap index
   - Serving individual sitemap files
   - Generating sitemaps when needed
   - Automatic regeneration of outdated sitemaps

## Migration Plan

### Step 1: Deploy the New Solution

The new `simplified-sitemap` function has been deployed alongside the existing functions. It uses the same database table (`sitemap_cache`) for storage.

### Step 2: Update Your Website Configuration

Update your website to use the new sitemap URL:

1. In your `robots.txt` file, update the sitemap URL to:
   ```
   Sitemap: https://soundraiser.io/api/sitemap
   ```

2. In Google Search Console, add the new sitemap URL:
   - Go to Google Search Console
   - Select your property
   - Navigate to Sitemaps
   - Remove the old sitemap URL
   - Add the new sitemap URL: `https://soundraiser.io/api/sitemap`

### Step 3: Configure Vercel Rewrites

Add the following rewrites to your Vercel configuration (in `vercel.json` or your Next.js config):

```json
{
  "rewrites": [
    {
      "source": "/sitemap.xml",
      "destination": "https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/simplified-sitemap"
    },
    {
      "source": "/sitemap-:file.xml",
      "destination": "https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/simplified-sitemap/:file"
    },
    {
      "source": "/api/sitemap",
      "destination": "https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/simplified-sitemap"
    },
    {
      "source": "/api/sitemap/:file",
      "destination": "https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/simplified-sitemap/:file"
    }
  ]
}
```

### Step 4: Verify the New Sitemap

1. Visit `https://soundraiser.io/sitemap.xml` to ensure the sitemap index is accessible
2. Check that individual sitemap files are accessible
3. Verify in Google Search Console that the sitemap is being properly crawled

### Step 5: Remove Old Functions (Optional)

Once you've confirmed the new solution is working correctly, you can optionally remove the old sitemap functions:

1. `sitemap`
2. `sitemap-file`
3. `sitemap-generator`
4. `sitemap-cache`
5. `sitemap-health`
6. `regenerate-sitemap`

## Benefits of the New Solution

1. **Simplicity**: A single function handles all sitemap functionality
2. **Reliability**: Automatic regeneration of outdated sitemaps
3. **Accessibility**: JWT verification is properly disabled and maintained
4. **Performance**: Optimized for better performance with caching
5. **Maintainability**: Easier to maintain and update

## Troubleshooting

If you encounter issues with the sitemap:

1. **Sitemap not accessible**: Check that JWT verification is disabled for the `simplified-sitemap` function in the Supabase dashboard
2. **Outdated sitemap**: Add `?regenerate=true` to the sitemap URL to force regeneration
3. **Missing URLs**: Check the database tables that provide URLs to the sitemap generator

## GitHub Actions Workflow

A GitHub Actions workflow has been set up to ensure that JWT verification remains disabled for all sitemap functions after deployments. This workflow:

1. Updates the main `config.toml` file
2. Updates function-specific `config.toml` files
3. Deploys all sitemap functions with the `--no-verify-jwt` flag

This ensures that the sitemap remains accessible to search engines even after redeployments. 