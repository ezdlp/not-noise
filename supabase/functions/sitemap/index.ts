
// Import from npm packages using proper URL format
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'
import { corsHeaders } from '../_shared/cors.ts'
import { Database } from '../_shared/database.types.ts'
import { generateSitemapXml, generateSitemapIndexXml } from '../_shared/sitemap-utils.ts'

// Supabase client setup with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

const CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400'
const XML_CONTENT_TYPE = 'application/xml; charset=UTF-8'

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(req.url)
    const fileParam = url.searchParams.get('file')
    
    // Add debug logging
    console.log(`Sitemap request received: ${req.url}`)
    console.log(`File param: ${fileParam || 'none (index requested)'}`)

    // Sitemap index (main sitemap.xml)
    if (!fileParam) {
      // Fetch total URL count for proper sitemap segmentation
      const { data: countData, error: countError } = await supabase.rpc('get_sitemap_url_count')
      
      if (countError) {
        console.error('Error fetching URL count:', countError)
        throw new Error(`Failed to get URL count: ${countError.message}`)
      }
      
      const totalUrls = countData?.total_urls || 0
      console.log(`Total URLs for sitemap: ${totalUrls}`)
      
      // Generate the sitemap index XML
      const sitemapIndexXml = generateSitemapIndexXml(totalUrls)
      
      return new Response(sitemapIndexXml, {
        headers: {
          'Content-Type': XML_CONTENT_TYPE,
          'Cache-Control': CACHE_CONTROL,
          ...corsHeaders
        }
      })
    }
    
    // Individual sitemap file
    const pageMatch = fileParam.match(/^(\d+)$/)
    if (!pageMatch) {
      return new Response('Invalid sitemap file parameter', { 
        status: 400,
        headers: corsHeaders
      })
    }
    
    const page = parseInt(pageMatch[1], 10)
    if (isNaN(page) || page < 1) {
      return new Response('Invalid sitemap page number', { 
        status: 400,
        headers: corsHeaders
      })
    }
    
    const URLS_PER_SITEMAP = 50000 // Standard limit for sitemaps
    const offset = (page - 1) * URLS_PER_SITEMAP
    
    console.log(`Fetching sitemap page ${page} with offset ${offset}`)
    
    // Fetch URLs for this sitemap segment
    const { data: urls, error: urlsError } = await supabase.rpc(
      'get_sitemap_urls_fixed',
      { p_offset: offset, p_limit: URLS_PER_SITEMAP }
    )
    
    if (urlsError) {
      console.error('Error fetching sitemap URLs:', urlsError)
      throw new Error(`Failed to get sitemap URLs: ${urlsError.message}`)
    }
    
    if (!urls || urls.length === 0) {
      return new Response('No URLs found for this sitemap segment', { 
        status: 404,
        headers: corsHeaders
      })
    }
    
    console.log(`Generated sitemap with ${urls.length} URLs`)
    
    // Generate sitemap XML for this segment
    const sitemapXml = generateSitemapXml(urls)
    
    return new Response(sitemapXml, {
      headers: {
        'Content-Type': XML_CONTENT_TYPE,
        'Cache-Control': CACHE_CONTROL,
        ...corsHeaders
      }
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    
    return new Response(`Error generating sitemap: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    })
  }
})
