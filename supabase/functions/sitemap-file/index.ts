
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
  
  // Extract the filename from the URL
  const url = new URL(req.url);
  let filename = '';
  
  // Parse the URL pathname to extract the filename
  const pathParts = url.pathname.split('/');
  if (pathParts.length > 0) {
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart.includes('sitemap-')) {
      filename = lastPart;
    } else {
      // Extract from query params as fallback
      const searchParams = url.searchParams;
      filename = searchParams.get('file') || '';
      
      // Ensure it has proper format
      if (filename && !filename.startsWith('sitemap-')) {
        filename = `sitemap-${filename}`;
      }
      
      // Ensure it has .xml extension
      if (filename && !filename.endsWith('.xml')) {
        filename = `${filename}.xml`;
      }
    }
  }
  
  // Log the request and extracted filename
  console.log(`Sitemap file request received: ${req.url}, filename: ${filename}`);
  
  // If no valid filename was extracted, return an error
  if (!filename || !filename.includes('sitemap-')) {
    console.error('Invalid or missing sitemap filename');
    
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://soundraiser.io/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
      {
        headers: corsHeaders
      }
    );
  }
  
  try {
    // Create a Supabase client using the Deno runtime environment variables
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );
    
    // Try to get the specific sitemap file from cache
    const { data: sitemapData, error: cacheError } = await supabaseClient
      .from('sitemap_cache')
      .select('content')
      .eq('key', filename)
      .single();
    
    // If we got an error or no data, log it and generate a basic fallback sitemap
    if (cacheError || !sitemapData) {
      console.warn(`Error fetching sitemap file [${filename}] from cache:`, cacheError);
      
      // Log the sitemap generation attempt
      await supabaseClient.from('sitemap_logs').insert({
        status: 'warning',
        message: `Sitemap file [${filename}] not found in cache, serving fallback`,
        source: 'sitemap-file-function',
        details: { 
          error: cacheError ? cacheError.message : 'No sitemap in cache',
          filename,
          request_url: req.url 
        }
      });
      
      // Return a basic fallback sitemap
      const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://soundraiser.io/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
      
      return new Response(fallbackSitemap, {
        headers: corsHeaders
      });
    }
    
    // Log success and return the sitemap from cache
    console.log(`Successfully retrieved sitemap file [${filename}] from cache`);
    
    // Return the cached sitemap with proper XML and CORS headers
    return new Response(sitemapData.content, {
      headers: corsHeaders
    });
    
  } catch (error) {
    // Log any unexpected errors
    console.error('Unexpected error in sitemap-file function:', error);
    
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
        message: `Error serving sitemap file [${filename}]`,
        source: 'sitemap-file-function',
        details: { 
          error: error.message,
          stack: error.stack,
          filename,
          request_url: req.url 
        }
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
    
    // Even on error, return a basic XML sitemap to avoid breaking crawlers
    const emergencyFallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://soundraiser.io/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    return new Response(emergencyFallbackSitemap, {
      headers: corsHeaders
    });
  }
});
