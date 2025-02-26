
import { supabase } from "@/integrations/supabase/client";

export async function generateSitemap() {
  try {
    // Use simpler RPC function calls that return just the data we need
    const { data: sitemap_data } = await supabase
      .rpc('get_sitemap_urls_paginated', { 
        p_offset: 0,
        p_limit: 1000
      });

    // Base URL from environment or default
    const baseUrl = "https://soundraiser.io";

    // Define static routes that should always be included
    const staticUrls = [
      "",  // home page
      "/blog",
      "/pricing", 
      "/spotify-playlist-promotion",
      "/streaming-calculator"
    ].map(path => `${baseUrl}${path}`);

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
${sitemap_data?.map(entry => `  <url>
    <loc>${baseUrl}${entry.url}</loc>
    <lastmod>${new Date(entry.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n') || ''}
</urlset>`;

    return sitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
}
