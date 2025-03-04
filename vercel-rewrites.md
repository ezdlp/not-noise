# Vercel Rewrites for Sitemap

To configure Vercel to use the new simplified sitemap function, add the following rewrites to your `vercel.json` file:

```json
{
  "rewrites": [
    {
      "source": "/sitemap.xml",
      "destination": "https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/simplified-sitemap"
    },
    {
      "source": "/sitemap-:file.xml",
      "destination": "https://owtufhdsuuyrgmxytclj.supabase.co/functions/v1/simplified-sitemap/sitemap-:file.xml"
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

If you already have a `vercel.json` file with other configurations, just add these rewrites to the existing "rewrites" array.

## robots.txt Update

Make sure your `robots.txt` file points to the new sitemap URL:

```
User-agent: *
Allow: /

Sitemap: https://soundraiser.io/sitemap.xml
```

## Verification

After configuring the rewrites, verify that the sitemap is accessible at:
- https://soundraiser.io/sitemap.xml
- https://soundraiser.io/sitemap-static.xml
- https://soundraiser.io/sitemap-blog.xml

## Regeneration

To manually regenerate the sitemap, you can access:
- https://soundraiser.io/api/sitemap?regenerate=true 