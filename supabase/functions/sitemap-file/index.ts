
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Define CORS headers for public access
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
  
  try {
    // Extract the filename from the URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const filenamePart = pathParts[pathParts.length - 1]; // Get the last part of the path
    
    // Extract just the filename without extension if present
    let filename = filenamePart;
    if (filename.endsWith('.xml')) {
      filename = filename.substring(0, filename.length - 4);
    }
    
    // Format the correct cache key
    const cacheKey = `sitemap-${filename}.xml`;
    
    console.log(`Sitemap file request for: ${cacheKey}`);
    
    // Create a Supabase client with SERVICE_ROLE_KEY to ensure access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );
    
    // Get the sitemap from cache
    const { data, error } = await supabaseClient
      .from('sitemap_cache')
      .select('content')
      .eq('key', cacheKey)
      .single();
    
    // If we got an error or no data, return a 404 or basic sitemap
    if (error || !data) {
      console.warn(`Error fetching sitemap ${cacheKey} from cache:`, error);
      
      // Log the issue to sitemap_logs
      await supabaseClient.from('sitemap_logs').insert({
        status: 'warning',
        message: `Sitemap file not found: ${cacheKey}`,
        source: 'sitemap-file-function',
        details: { 
          error: error ? error.message : 'Not found',
          request_url: req.url 
        }
      });
      
      // Generate a basic fallback sitemap for the request
      if (filename === 'static') {
        // Basic sitemap for static pages if the static sitemap is missing
        const staticSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://soundraiser.io/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
        
        return new Response(staticSitemap, {
          headers: corsHeaders
        });
      }
      
      // Return a 404 if the requested sitemap doesn't exist and it's not a known type
      return new Response(`Sitemap file ${cacheKey} not found`, {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain'
        }
      });
    }
    
    console.log(`Successfully retrieved sitemap file: ${cacheKey}`);
    
    // Return the cached sitemap with proper XML and CORS headers
    return new Response(data.content, {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Unexpected error in sitemap-file function:', error);
    
    // Try to log the error to the database
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
        message: 'Error serving sitemap file',
        source: 'sitemap-file-function',
        details: { 
          error: error.message,
          stack: error.stack,
          request_url: req.url 
        }
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
    
    // Return a 500 error with a basic message
    return new Response('An error occurred processing the sitemap request', {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain'
      }
    });
  }
});
