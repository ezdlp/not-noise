
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Define CORS headers to allow public access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=UTF-8',
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Log the request for debugging
  console.log(`Sitemap request received: ${req.url}`);
  
  try {
    // Create a Supabase client using the Deno runtime environment variables
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );
    
    // Log that we're attempting to fetch from cache
    console.log('Attempting to fetch sitemap from cache');
    
    // Try to get the sitemap from cache
    const { data: sitemapData, error: cacheError } = await supabaseClient
      .from('sitemap_cache')
      .select('content')
      .eq('key', 'sitemap-index.xml')
      .single();
    
    // If we got an error or no data, log it and generate a basic fallback sitemap
    if (cacheError || !sitemapData) {
      console.warn('Error fetching sitemap from cache:', cacheError);
      
      // Log the sitemap generation attempt
      await supabaseClient.from('sitemap_logs').insert({
        status: 'warning',
        message: 'Sitemap not found in cache, serving fallback',
        source: 'sitemap-function',
        details: { 
          error: cacheError ? cacheError.message : 'No sitemap in cache',
          request_url: req.url 
        }
      });
      
      // Return a basic fallback sitemap
      const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://soundraiser.io/sitemap-static.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
</sitemapindex>`;
      
      return new Response(fallbackSitemap, {
        headers: corsHeaders
      });
    }
    
    // Log success and return the sitemap from cache
    console.log('Successfully retrieved sitemap from cache');
    
    // Return the cached sitemap with proper XML and CORS headers
    return new Response(sitemapData.content, {
      headers: corsHeaders
    });
    
  } catch (error) {
    // Log any unexpected errors
    console.error('Unexpected error in sitemap function:', error);
    
    // Try to log the error to the database if possible
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: { persistSession: false }
        }
      );
      
      await supabaseClient.from('sitemap_logs').insert({
        status: 'error',
        message: 'Error serving sitemap',
        source: 'sitemap-function',
        details: { 
          error: error.message,
          stack: error.stack,
          request_url: req.url 
        }
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
    
    // Even on error, return a basic XML sitemap to avoid breaking crawlers
    const emergencyFallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://soundraiser.io/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
</sitemapindex>`;
    
    return new Response(emergencyFallbackSitemap, {
      headers: corsHeaders
    });
  }
});
