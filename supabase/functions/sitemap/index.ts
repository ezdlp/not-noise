
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=UTF-8',
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  'X-Robots-Tag': 'noindex'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching sitemap URLs...");

    // Get pagination parameters from query string
    const url = new URL(req.url);
    const segment = url.searchParams.get('segment');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = 1000; // Limit number of URLs per sitemap
    
    if (segment === 'main') {
      // Generate the main sitemap index
      const { count: totalUrls } = await supabase.rpc('get_sitemap_url_count').single();
      const totalPages = Math.ceil(totalUrls / pageSize);
      
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://soundraiser.io/sitemap-main.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://soundraiser.io/sitemap-blog.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  ${Array.from({ length: totalPages }, (_, i) => `
  <sitemap>
    <loc>https://soundraiser.io/sitemap-${i + 1}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('')}
</sitemapindex>`;

      return new Response(sitemapIndex, { headers: corsHeaders });
    }

    // Fetch URLs from database
    const { data: urls, error } = await supabase
      .rpc('get_sitemap_urls_paginated', {
        p_offset: (page - 1) * pageSize,
        p_limit: pageSize
      });

    if (error) {
      console.error("Error fetching sitemap URLs:", error);
      throw error;
    }

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>https://soundraiser.io${url.url}</loc>
    <lastmod>${url.updated_at}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('')}
</urlset>`;

    console.log(`Generated sitemap with ${urls.length} URLs`);
    return new Response(sitemap, { headers: corsHeaders });

  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
