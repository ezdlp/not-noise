
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
};

// Escape special characters in XML
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting sitemap generation...");

    const url = new URL(req.url);
    const segment = url.searchParams.get('segment');

    // Get total URL count for pagination
    const { data: countResult, error: countError } = await supabase
      .rpc('get_sitemap_url_count')
      .maybeSingle();

    if (countError) {
      console.error("Error fetching URL count:", countError);
      throw new Error(`Failed to get URL count: ${countError.message}`);
    }

    const totalUrls = countResult?.total_urls || 0;
    const pageSize = 1000;
    const totalPages = Math.ceil(totalUrls / pageSize);
    
    console.log(`Total URLs: ${totalUrls}, Pages needed: ${totalPages}\n`);

    // Generate main sitemap index
    if (!segment) {
      console.log("Generating main sitemap index...");
      
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${Array.from({ length: totalPages }, (_, i) => `
  <sitemap>
    <loc>https://soundraiser.io/sitemap-${i + 1}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('')}
</sitemapindex>`;

      return new Response(sitemapIndex, { 
        headers: corsHeaders,
        status: 200
      });
    }

    // Extract page number from segment
    const pageNumber = parseInt(segment);
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
      throw new Error('Invalid sitemap segment');
    }

    // Generate paginated sitemap
    console.log(`Generating sitemap page ${pageNumber}...`);
    
    const { data: urls, error: urlError } = await supabase
      .rpc('get_sitemap_urls_paginated', {
        p_offset: (pageNumber - 1) * pageSize,
        p_limit: pageSize
      });

    if (urlError) {
      console.error("Error fetching URLs:", urlError);
      throw new Error(`Failed to fetch URLs: ${urlError.message}`);
    }

    if (!urls || urls.length === 0) {
      console.log("No URLs found for this page");
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
        { headers: corsHeaders }
      );
    }

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>https://soundraiser.io${escapeXml(url.url)}</loc>
    <lastmod>${new Date(url.updated_at).toISOString()}</lastmod>
    <changefreq>${escapeXml(url.changefreq)}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('')}
</urlset>`;

    console.log(`Generated sitemap with ${urls.length} URLs`);
    return new Response(sitemap, { 
      headers: corsHeaders,
      status: 200
    });

  } catch (error) {
    console.error("Error in sitemap generation:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Error: ${escapeXml(error.message)} -->
</urlset>`, 
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
});
