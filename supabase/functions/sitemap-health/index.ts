
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface HealthCheckResponse {
  status: 'ok' | 'warn' | 'error';
  lastUpdated: string | null;
  age: number | null;
  urlCount: number | null;
  errors: string[];
  warnings: string[];
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  }

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
    
    // If an API key is provided, validate it
    if (apiKey && apiKey !== validKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Initialize response object
    const response: HealthCheckResponse = {
      status: 'ok',
      lastUpdated: null,
      age: null,
      urlCount: null,
      errors: [],
      warnings: []
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if sitemap exists in cache
    const { data: sitemapData, error: sitemapError } = await supabase
      .from('sitemap_cache')
      .select('content, updated_at')
      .eq('key', 'sitemap.xml')
      .single()

    if (sitemapError) {
      response.status = 'error'
      response.errors.push(`Failed to retrieve sitemap: ${sitemapError.message}`)
    } else if (sitemapData) {
      // Get basic sitemap info
      response.lastUpdated = sitemapData.updated_at
      
      // Calculate age in hours
      const updatedAt = new Date(sitemapData.updated_at)
      const now = new Date()
      const ageInMs = now.getTime() - updatedAt.getTime()
      response.age = Math.floor(ageInMs / (1000 * 60 * 60)) // Convert ms to hours
      
      // Count URLs in sitemap
      const urlMatches = sitemapData.content.match(/<url>/g)
      response.urlCount = urlMatches ? urlMatches.length : 0
      
      // Check if sitemap is too old (more than 24 hours)
      if (response.age > 24) {
        response.status = 'warn'
        response.warnings.push(`Sitemap is ${response.age} hours old, which exceeds the 24 hour threshold.`)
      }
      
      // Check if sitemap has too few URLs (less than 10)
      if (response.urlCount < 10) {
        response.status = 'warn'
        response.warnings.push(`Sitemap contains only ${response.urlCount} URLs, which is below the expected minimum of 10.`)
      }
    } else {
      response.status = 'error'
      response.errors.push('Sitemap not found in database')
    }
    
    // Check for recent regeneration errors
    const { data: errorLogs, error: logsError } = await supabase
      .from('sitemap_logs')
      .select('*')
      .eq('status', 'error')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (logsError) {
      response.warnings.push(`Could not check for recent errors: ${logsError.message}`)
    } else if (errorLogs && errorLogs.length > 0) {
      // Check if there are recent errors (last 24 hours)
      const recentErrors = errorLogs.filter(log => {
        const logTime = new Date(log.created_at)
        const now = new Date()
        const ageInHours = (now.getTime() - logTime.getTime()) / (1000 * 60 * 60)
        return ageInHours < 24
      })
      
      if (recentErrors.length > 0) {
        response.status = 'error'
        response.errors.push(`Found ${recentErrors.length} recent sitemap regeneration errors in the last 24 hours`)
      }
    }

    // Return health check response
    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Health check error:', error)
    
    return new Response(
      JSON.stringify({ 
        status: 'error',
        errors: [`Unexpected error: ${error.message}`],
        warnings: []
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
