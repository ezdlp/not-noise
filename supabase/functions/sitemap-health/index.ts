
// Import from npm packages using proper URL format
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'
import { corsHeaders } from '../_shared/cors.ts'
import { Database } from '../_shared/database.types.ts'

// Supabase client setup with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// API key for authorization
const WEBHOOK_KEY = Deno.env.get('SITEMAP_WEBHOOK_KEY') || ''

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Sitemap health check requested')
    
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
    
    // Get latest sitemap logs
    const { data: logs, error: logsError } = await supabase
      .from('sitemap_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (logsError) {
      console.error('Error fetching sitemap logs:', logsError)
      throw new Error(`Failed to fetch sitemap logs: ${logsError.message}`)
    }
    
    // Get sitemap cache stats
    const { data: cacheStats, error: cacheError } = await supabase
      .from('sitemap_cache')
      .select('id, key, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (cacheError) {
      console.error('Error fetching sitemap cache stats:', cacheError)
    }
    
    // Check last successful generation
    const lastSuccess = logs?.find(log => log.status === 'completed')
    
    // Get sitemap URL count
    const { data: countData, error: countError } = await supabase.rpc('get_sitemap_url_count')
    
    if (countError) {
      console.error('Error fetching URL count:', countError)
    }
    
    const totalUrls = countData?.total_urls || 0
    
    // Get health status
    const isHealthy = !!lastSuccess && 
                     (new Date().getTime() - new Date(lastSuccess.created_at).getTime()) < (24 * 60 * 60 * 1000)
    
    // Construct health report
    const healthReport = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      lastGeneration: lastSuccess ? {
        timestamp: lastSuccess.created_at,
        source: lastSuccess.source,
        details: lastSuccess.details
      } : null,
      urlCount: totalUrls,
      cache: {
        entries: cacheStats?.length || 0,
        recentEntries: cacheStats || []
      },
      recentLogs: logs || []
    }
    
    return new Response(JSON.stringify({
      success: true,
      health: healthReport
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  } catch (error) {
    console.error('Sitemap health check error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      message: `Error checking sitemap health: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
})
