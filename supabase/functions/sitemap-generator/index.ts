
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

// Initialize Supabase client with admin privileges
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// API security key to prevent unauthorized regeneration
const API_KEY = Deno.env.get('SITEMAP_WEBHOOK_KEY') || 'default-webhook-key'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify API key for security
    const authHeader = req.headers.get('x-api-key')
    if (!authHeader || authHeader !== API_KEY) {
      console.error('Unauthorized sitemap regeneration attempt')
      return new Response(JSON.stringify({ 
        error: 'Unauthorized. Invalid or missing API key' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Process request body if available
    let source = 'manual'
    let additionalInfo = {}
    
    if (req.method === 'POST') {
      try {
        const body = await req.json()
        source = body.source || source
        additionalInfo = body
      } catch (e) {
        // Continue if body parsing fails, use defaults
        console.warn('Could not parse request body')
      }
    }

    // Start the regeneration process
    console.log(`Starting sitemap regeneration from source: ${source}`)
    await regenerateSitemap(source, additionalInfo)
    
    const response = {
      success: true,
      message: 'Sitemap regeneration started',
      timestamp: new Date().toISOString(),
      source
    }
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Sitemap regeneration error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to regenerate sitemap',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function regenerateSitemap(source: string, additionalInfo: any = {}) {
  const startTime = Date.now()
  const details = {
    triggered_by: source,
    ...additionalInfo,
    timestamp: new Date().toISOString()
  }
  
  try {
    // Log regeneration start
    await supabaseAdmin
      .from('sitemap_logs')
      .insert({
        status: 'started',
        message: `Sitemap regeneration started from ${source}`,
        source,
        details
      })
    
    // Delete all existing cache entries to force regeneration
    const { error: deleteError } = await supabaseAdmin
      .from('sitemap_cache')
      .delete()
      .neq('name', 'placeholder')
    
    if (deleteError) {
      throw new Error(`Failed to clear sitemap cache: ${deleteError.message}`)
    }
    
    // Warm up cache by pre-generating index
    const indexUrl = new URL(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sitemap`)
    await fetch(indexUrl, { headers: { 'Cache-Control': 'no-cache' } })
    
    // Get URL count for sitemap files
    const { data: countData, error: countError } = await supabaseAdmin
      .rpc('get_sitemap_url_count')
    
    if (countError) {
      throw new Error(`Failed to get URL count: ${countError.message}`)
    }
    
    const totalUrls = countData?.total_urls || 0
    const urlsPerFile = 5000
    const sitemapCount = Math.ceil(totalUrls / urlsPerFile)
    
    // Warm up first few sitemaps (most important ones)
    const warmupLimit = Math.min(sitemapCount, 3)
    for (let i = 1; i <= warmupLimit; i++) {
      const fileUrl = new URL(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sitemap`)
      fileUrl.searchParams.set('file', i.toString())
      await fetch(fileUrl, { headers: { 'Cache-Control': 'no-cache' } })
    }
    
    // Log successful completion
    const duration = Date.now() - startTime
    await supabaseAdmin
      .from('sitemap_logs')
      .insert({
        status: 'completed',
        message: `Sitemap regenerated successfully. ${totalUrls} URLs in ${sitemapCount} sitemap files.`,
        source,
        details: {
          ...details,
          duration_ms: duration,
          sitemap_count: sitemapCount,
          total_urls: totalUrls
        }
      })
    
    console.log(`Sitemap regeneration completed in ${duration}ms`)
    
    // Optionally ping search engines here
    // This replaces the functionality from the standalone ping-search-engines function
    await pingSearchEngines(totalUrls)
    
    return { success: true, sitemapCount, totalUrls, duration }
  } catch (error) {
    // Log error
    await supabaseAdmin
      .from('sitemap_logs')
      .insert({
        status: 'error',
        message: `Sitemap regeneration failed: ${error.message}`,
        source,
        details: {
          ...details,
          error: error.message,
          stack: error.stack,
          duration_ms: Date.now() - startTime
        }
      })
    
    console.error('Error regenerating sitemap:', error)
    throw error
  }
}

async function pingSearchEngines(urlCount: number) {
  try {
    const siteUrl = Deno.env.get('SITE_URL') || 'https://soundraiser.io'
    const sitemapUrl = `${siteUrl}/sitemap.xml`
    
    // Only ping if we have a reasonable number of URLs
    if (urlCount < 10) {
      console.log('Not pinging search engines, too few URLs')
      return
    }
    
    // Google
    try {
      const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      const googleResponse = await fetch(googlePingUrl)
      console.log(`Google ping status: ${googleResponse.status}`)
    } catch (e) {
      console.warn('Google ping failed:', e)
    }
    
    // Bing
    try {
      const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      const bingResponse = await fetch(bingPingUrl)
      console.log(`Bing ping status: ${bingResponse.status}`)
    } catch (e) {
      console.warn('Bing ping failed:', e)
    }
    
    console.log('Search engine ping completed')
  } catch (error) {
    console.warn('Error pinging search engines:', error)
    // Non-critical error, don't throw
  }
}
