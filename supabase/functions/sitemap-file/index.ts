
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Request URL:', req.url);
    
    // Extract the filename from the URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // The URL pattern will be like:
    // /sitemap-file/sitemap-static.xml or /sitemap-file/static.xml
    const lastPathPart = pathParts[pathParts.length - 1];
    console.log('Path parts:', pathParts);
    console.log('Last path part:', lastPathPart);
    
    // Extract the file parameter
    let cacheKey;
    
    // If the request already contains the full filename (sitemap-xxx.xml)
    if (lastPathPart.startsWith('sitemap-')) {
      cacheKey = lastPathPart;
    } 
    // If the request comes from vercel rewrite with just the file portion (/sitemap-:file.xml)
    else if (lastPathPart.endsWith('.xml')) {
      // This means the URL was something like /sitemap-file/static.xml
      cacheKey = `sitemap-${lastPathPart}`;
    }
    // Fallback - try to handle other formats
    else {
      cacheKey = `sitemap-${lastPathPart}.xml`;
    }
    
    console.log('Looking for cache key:', cacheKey);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Fetch the requested sitemap from cache
    const { data, error } = await supabase
      .from('sitemap_cache')
      .select('content, etag')
      .eq('key', cacheKey)
      .maybeSingle();

    if (error) {
      throw new Error(`Error fetching sitemap: ${error.message}`);
    }

    if (!data) {
      console.error(`Sitemap not found: ${cacheKey}`);
      
      // Log cache keys for debugging
      const { data: cacheKeys } = await supabase
        .from('sitemap_cache')
        .select('key')
        .order('key');
      
      console.log('Available cache keys:', cacheKeys?.map(item => item.key));
      
      await supabase.from('sitemap_logs').insert({
        status: 'error',
        message: 'Sitemap not found',
        source: 'sitemap-file',
        details: { requestedKey: cacheKey }
      });
      
      return new Response('Sitemap not found', {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain'
        }
      });
    }

    // Log the successful request
    await supabase.from('sitemap_logs').insert({
      status: 'info',
      message: 'Sitemap file served',
      source: 'sitemap-file',
      details: { key: cacheKey }
    });

    // Return the sitemap XML with proper headers
    return new Response(data.content, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'ETag': data.etag || '""'
      }
    });

  } catch (error) {
    console.error('Error serving sitemap file:', error);
    
    // Try to log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );

      await supabase.from('sitemap_logs').insert({
        status: 'error',
        message: 'Error serving sitemap file',
        source: 'sitemap-file',
        details: {
          error: error.message,
          stack: error.stack
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error serving sitemap file',
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
