
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface SearchEnginePingResult {
  engine: string;
  status: number;
  success: boolean;
  message: string;
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
    // Check for API key authentication
    const apiKey = req.headers.get('x-api-key')
    const validKey = Deno.env.get('SITEMAP_API_KEY') || 
                     await getConfigValue('sitemap_webhook_key')
    
    // If an API key is not provided or is invalid, return 401
    if (!apiKey || apiKey !== validKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Get the site URL from environment or default
    const siteUrl = Deno.env.get('SITE_URL') || 'https://soundraiser.io'
    const sitemapUrl = `${siteUrl}/sitemap.xml`
    
    // Log ping attempt
    await logSitemapEvent('success', 'Search engine ping initiated', 'ping-search-engines')
    
    // Define search engines to ping
    const searchEngines = [
      {
        name: 'Google',
        url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      },
      {
        name: 'Bing',
        url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      }
    ]
    
    // Ping each search engine
    const results: SearchEnginePingResult[] = []
    
    for (const engine of searchEngines) {
      try {
        const response = await fetch(engine.url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Soundraiser-SitemapPing/1.0'
          }
        })
        
        const success = response.status >= 200 && response.status < 300
        
        results.push({
          engine: engine.name,
          status: response.status,
          success,
          message: success ? 'Successfully pinged' : `Failed with status ${response.status}`
        })
        
        // Log the result
        await logSitemapEvent(
          success ? 'success' : 'warning',
          `${engine.name} ping ${success ? 'successful' : 'failed'} with status ${response.status}`,
          'ping-search-engines',
          { engine: engine.name, status: response.status }
        )
      } catch (error) {
        results.push({
          engine: engine.name,
          status: 0,
          success: false,
          message: `Error: ${error.message}`
        })
        
        // Log the error
        await logSitemapEvent(
          'error',
          `${engine.name} ping error: ${error.message}`,
          'ping-search-engines',
          { engine: engine.name, error: error.message }
        )
      }
    }
    
    // Check if any pings were successful
    const anySuccess = results.some(r => r.success)
    
    return new Response(
      JSON.stringify({
        success: anySuccess,
        message: anySuccess 
          ? 'Successfully pinged at least one search engine' 
          : 'Failed to ping any search engines',
        results
      }),
      { 
        status: anySuccess ? 200 : 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    // Log the error
    try {
      await logSitemapEvent(
        'error',
        `Unhandled exception during search engine ping: ${error.message}`,
        'ping-search-engines',
        { error: error.message, stack: error.stack }
      )
    } catch (logError) {
      console.error('Failed to log sitemap error:', logError)
      console.error('Original error:', error)
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
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

// Helper function to get config values from the database
async function getConfigValue(key: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single()
    
    if (error || !data) {
      console.error(`Error fetching config value for ${key}:`, error)
      return ''
    }
    
    return data.value
  } catch (error) {
    console.error(`Error in getConfigValue for ${key}:`, error)
    return ''
  }
}

// Helper function to log sitemap events
async function logSitemapEvent(
  status: 'success' | 'error' | 'warning',
  message: string,
  source: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { error } = await supabase.from('sitemap_logs').insert({
      status,
      message,
      details,
      source,
    })
    
    if (error) {
      console.error('Failed to log sitemap event:', error)
    }
  } catch (error) {
    console.error('Exception while logging sitemap event:', error)
  }
}
