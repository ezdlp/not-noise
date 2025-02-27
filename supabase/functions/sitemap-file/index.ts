
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
    const url = new URL(req.url);
    console.log('Request URL:', req.url);
    console.log('Search params:', Object.fromEntries(url.searchParams.entries()));
    
    // Extract the filename from query parameters (from Vercel rewrite)
    let fileParam = url.searchParams.get('file');
    
    // If no file parameter, try to extract from path (for direct calls)
    if (!fileParam) {
      const pathParts = url.pathname.split('/').filter(Boolean);
      fileParam = pathParts[pathParts.length - 1];
      // Remove .xml extension if present in the path
      if (fileParam && fileParam.endsWith('.xml')) {
        fileParam = fileParam.replace(/\.xml$/, '');
      }
    }
    
    console.log('Extracted file parameter:', fileParam);
    
    // Ensure we have a file parameter to look for
    if (!fileParam) {
      console.error('No file parameter found in request');
      return new Response('Missing file parameter', {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain'
        }
      });
    }
    
    // Construct the cache key - remove any existing 'sitemap-' prefix to avoid duplication
    let cacheKey = fileParam;
    if (cacheKey.startsWith('sitemap-')) {
      cacheKey = cacheKey.substring(8);
    }
    cacheKey = `sitemap-${cacheKey}.xml`;
    
    console.log('Looking for cache key:', cacheKey);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Log the request attempt
    await supabase.from('sitemap_logs').insert({
      status: 'info',
      message: 'Sitemap file requested',
      source: 'sitemap-file',
      details: { requestUrl: req.url, cacheKey, fileParam }
    });

    // Fetch the requested sitemap from cache
    const { data, error } = await supabase
      .from('sitemap_cache')
      .select('content, etag')
      .eq('key', cacheKey)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching sitemap: ${error.message}`);
      
      // Log the database error
      await supabase.from('sitemap_logs').insert({
        status: 'error',
        message: 'Database error fetching sitemap',
        source: 'sitemap-file',
        details: { error: error.message, cacheKey }
      });
      
      throw new Error(`Error fetching sitemap: ${error.message}`);
    }

    if (!data) {
      console.error(`Sitemap not found: ${cacheKey}`);
      
      // Log available cache keys for debugging
      const { data: cacheKeys } = await supabase
        .from('sitemap_cache')
        .select('key')
        .order('key');
      
      console.log('Available cache keys:', cacheKeys?.map(item => item.key));
      
      // Log the not found error
      await supabase.from('sitemap_logs').insert({
        status: 'error',
        message: 'Sitemap not found',
        source: 'sitemap-file',
        details: { 
          requestedKey: cacheKey,
          availableKeys: cacheKeys?.map(item => item.key) 
        }
      });
      
      return new Response(`Sitemap not found: ${cacheKey}`, {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain'
        }
      });
    }

    // Log the successful request
    await supabase.from('sitemap_logs').insert({
      status: 'success',
      message: 'Sitemap file served',
      source: 'sitemap-file',
      details: { key: cacheKey }
    });

    console.log(`Successfully serving sitemap: ${cacheKey}`);
    
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
