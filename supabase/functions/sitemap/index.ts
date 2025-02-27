
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
    console.log('Serving sitemap index');
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Fetch the sitemap index from cache
    const { data, error } = await supabase
      .from('sitemap_cache')
      .select('content, etag')
      .eq('key', 'sitemap-index.xml')
      .maybeSingle();

    if (error) {
      throw new Error(`Error fetching sitemap index: ${error.message}`);
    }

    if (!data) {
      console.log('Sitemap index not found, triggering regeneration');
      
      // Log the issue
      await supabase.from('sitemap_logs').insert({
        status: 'warning',
        message: 'Sitemap index not found, triggering regeneration',
        source: 'sitemap'
      });
      
      // Try to trigger regeneration
      try {
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/regenerate-sitemap`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to trigger regeneration: ${response.statusText}`);
        }
        
        console.log('Regeneration triggered successfully');
      } catch (regError) {
        console.error('Error triggering regeneration:', regError);
      }
      
      return new Response('Sitemap is being generated, please try again in a few moments', {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
          'Retry-After': '30'
        }
      });
    }

    // Log the successful request
    await supabase.from('sitemap_logs').insert({
      status: 'info',
      message: 'Sitemap index served',
      source: 'sitemap'
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
    console.error('Error serving sitemap index:', error);
    
    // Try to log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );

      await supabase.from('sitemap_logs').insert({
        status: 'error',
        message: 'Error serving sitemap index',
        source: 'sitemap',
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
        message: 'Error serving sitemap index',
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
