
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=UTF-8',
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://soundraiser.io';

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get URL count to determine pagination
    const { data: countData, error: countError } = await supabase
      .rpc('get_sitemap_url_count');
    
    if (countError) {
      console.error('Error getting URL count:', countError);
      return new Response(
        `Error getting URL count: ${countError.message}`,
        { status: 500, headers: corsHeaders }
      );
    }
    
    const totalUrls = countData?.[0]?.total_urls || 0;
    console.log(`Total URLs for sitemap: ${totalUrls}`);
    
    if (totalUrls === 0) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- No URLs found -->
</urlset>`,
        { headers: corsHeaders }
      );
    }
    
    // Get all URLs (with pagination if needed)
    const batchSize = 1000;
    let allUrls = [];
    
    for (let offset = 0; offset < totalUrls; offset += batchSize) {
      const { data: urlsData, error: urlsError } = await supabase
        .rpc('get_sitemap_urls_paginated', {
          p_offset: offset,
          p_limit: batchSize
        });
      
      if (urlsError) {
        console.error(`Error fetching URLs (offset ${offset}):`, urlsError);
        return new Response(
          `Error fetching URLs: ${urlsError.message}`,
          { status: 500, headers: corsHeaders }
        );
      }
      
      if (urlsData && urlsData.length > 0) {
        allUrls = [...allUrls, ...urlsData];
        console.log(`Fetched ${urlsData.length} URLs from offset ${offset}`);
      }
    }
    
    if (allUrls.length === 0) {
      console.error('No URLs fetched despite positive count');
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- No URLs found -->
</urlset>`,
        { headers: corsHeaders }
      );
    }
    
    // Build the sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
    
    allUrls.forEach(url => {
      const fullUrl = SITE_URL + url.url;
      const lastmod = url.updated_at ? new Date(url.updated_at).toISOString() : new Date().toISOString();
      
      sitemap += `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>
`;
    });
    
    sitemap += `</urlset>`;
    
    console.log(`Successfully generated sitemap with ${allUrls.length} URLs`);
    
    return new Response(sitemap, { headers: corsHeaders });
  } catch (error) {
    console.error('Unexpected error generating sitemap:', error);
    return new Response(
      `Error generating sitemap: ${error.message}`,
      { status: 500, headers: corsHeaders }
    );
  }
});
