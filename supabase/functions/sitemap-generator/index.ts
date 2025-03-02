
// Import from npm packages using proper URL format
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'
import { corsHeaders } from '../_shared/cors.ts'
import { Database } from '../_shared/database.types.ts'

// Supabase client setup with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Define search engines to ping
const SEARCH_ENGINES = [
  {
    name: 'Google',
    pingUrl: 'https://www.google.com/ping?sitemap='
  },
  {
    name: 'Bing',
    pingUrl: 'https://www.bing.com/ping?sitemap='
  }
]

// Get site URL from environment or use default
const SITE_URL = Deno.env.get('SITE_URL') || 'https://soundraiser.io'
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`

// API key for authorization
const WEBHOOK_KEY = Deno.env.get('SITEMAP_WEBHOOK_KEY') || ''

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Log request info
    console.log(`Sitemap generation request received: ${req.url}`)
    
    // Validate API key if provided in config
    if (WEBHOOK_KEY) {
      const apiKey = req.headers.get('x-api-key') || ''
      if (apiKey !== WEBHOOK_KEY) {
        console.error('Invalid API key provided')
        return new Response('Unauthorized', { 
          status: 401,
          headers: corsHeaders
        })
      }
    }
    
    // Parse request body
    let requestInfo = { source: 'manual', timestamp: new Date().toISOString() }
    
    try {
      const body = await req.json()
      requestInfo = {
        source: body.source || 'manual',
        timestamp: body.timestamp || new Date().toISOString()
      }
    } catch (e) {
      // If body parsing fails, use default values
      console.log('No valid JSON body, using defaults')
    }
    
    console.log(`Regenerating sitemap. Source: ${requestInfo.source}`)
    
    // Log the regeneration event
    const { data: logData, error: logError } = await supabase
      .from('sitemap_logs')
      .insert({
        status: 'started',
        source: requestInfo.source,
        message: 'Sitemap generation started',
        details: requestInfo
      })
      .select()
    
    if (logError) {
      console.error('Error logging sitemap generation start:', logError)
    }
    
    const logId = logData?.[0]?.id
    
    // Clear sitemap cache
    console.log('Clearing sitemap cache')
    const { error: clearCacheError } = await supabase
      .from('sitemap_cache')
      .delete()
      .neq('id', 0) // Dummy condition to delete all
    
    if (clearCacheError) {
      console.error('Error clearing sitemap cache:', clearCacheError)
      throw new Error(`Failed to clear sitemap cache: ${clearCacheError.message}`)
    }
    
    // Ping search engines
    console.log('Pinging search engines')
    const pingResults = []
    
    for (const engine of SEARCH_ENGINES) {
      try {
        const pingUrl = `${engine.pingUrl}${encodeURIComponent(SITEMAP_URL)}`
        console.log(`Pinging ${engine.name}: ${pingUrl}`)
        
        const response = await fetch(pingUrl, { method: 'GET' })
        const status = response.status
        
        pingResults.push({
          engine: engine.name,
          status,
          success: status >= 200 && status < 300
        })
        
        console.log(`Pinged ${engine.name}, status: ${status}`)
      } catch (error) {
        console.error(`Error pinging ${engine.name}:`, error)
        pingResults.push({
          engine: engine.name,
          status: 0,
          success: false,
          error: error.message
        })
      }
    }
    
    // Update log with completion status
    if (logId) {
      const { error: updateError } = await supabase
        .from('sitemap_logs')
        .update({
          status: 'completed',
          message: 'Sitemap generation completed',
          details: {
            ...requestInfo,
            pingResults
          }
        })
        .eq('id', logId)
      
      if (updateError) {
        console.error('Error updating sitemap log:', updateError)
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Sitemap regenerated and search engines pinged',
      source: requestInfo.source,
      pingResults
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    
    // Log error if possible
    try {
      await supabase
        .from('sitemap_logs')
        .insert({
          status: 'error',
          message: `Error generating sitemap: ${error.message}`,
          source: 'edge_function',
          details: { error: error.message }
        })
    } catch (logError) {
      console.error('Error logging sitemap failure:', logError)
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: `Error generating sitemap: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
})
