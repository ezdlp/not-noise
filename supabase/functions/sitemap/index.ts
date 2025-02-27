
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const siteUrl = Deno.env.get('SITE_URL') || 'https://soundraiser.io'

    // Get sitemap from cache
    const { data: sitemap, error } = await supabase
      .from('sitemap_cache')
      .select('content, updated_at')
      .eq('key', 'sitemap.xml')
      .single()
      
    if (error) {
      // Log the error to sitemap_logs
      await supabase.from('sitemap_logs').insert({
        status: 'error',
        message: 'Failed to retrieve sitemap from cache',
        details: { error: error.message },
        source: 'sitemap-endpoint'
      })
      
      return new Response(
        JSON.stringify({ error: 'Sitemap not found' }),
        { 
          status: 404, 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }
    
    // Set headers for XML content and caching
    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
      'ETag': `"${Date.parse(sitemap.updated_at).toString()}"`,
      'Last-Modified': new Date(sitemap.updated_at).toUTCString()
    }
    
    // Check if we have a conditional request
    const ifNoneMatch = req.headers.get('if-none-match')
    const ifModifiedSince = req.headers.get('if-modified-since')
    
    // Handle 304 Not Modified
    if (
      (ifNoneMatch && ifNoneMatch === headers.ETag) ||
      (ifModifiedSince && new Date(ifModifiedSince) >= new Date(sitemap.updated_at))
    ) {
      return new Response(null, { 
        status: 304,
        headers
      })
    }
    
    // Return the sitemap
    return new Response(sitemap.content, { 
      status: 200,
      headers
    })
  } catch (error) {
    // Log the error
    console.error('Sitemap endpoint error:', error)
    
    // Initialize Supabase client for error logging
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      await supabase.from('sitemap_logs').insert({
        status: 'error',
        message: 'Unhandled exception in sitemap endpoint',
        details: { error: error.message, stack: error.stack },
        source: 'sitemap-endpoint'
      })
    } catch (logError) {
      console.error('Failed to log sitemap error:', logError)
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
