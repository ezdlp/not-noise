
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

// Initialize Supabase client with admin privileges
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const CACHE_DURATION = 3600 // 1 hour cache

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const fileParam = url.searchParams.get('file')
    
    // Handle specific sitemap file request (former sitemap-file function)
    if (fileParam) {
      return await serveSitemapFile(fileParam)
    }
    
    // Handle main sitemap index (former sitemap function)
    return await serveSitemapIndex()
  } catch (error) {
    console.error('Sitemap error:', error.message)
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><error>${error.message}</error>`,
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=UTF-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    )
  }
})

async function serveSitemapIndex() {
  console.log('Serving sitemap index')
  
  // Check cache first
  const { data: cacheData, error: cacheError } = await supabaseAdmin
    .from('sitemap_cache')
    .select('content, updated_at')
    .eq('name', 'sitemap.xml')
    .maybeSingle()

  // If cache is valid and not too old, use it
  if (cacheData && !cacheError && cacheData.content) {
    const cacheAge = Date.now() - new Date(cacheData.updated_at).getTime()
    if (cacheAge < CACHE_DURATION * 1000) {
      console.log('Serving sitemap index from cache')
      return new Response(cacheData.content, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=UTF-8',
          'Cache-Control': `public, max-age=${CACHE_DURATION}, stale-while-revalidate=86400`
        }
      })
    }
  }

  // Get total URL count to determine number of sitemaps
  const { data: countData, error: countError } = await supabaseAdmin.rpc('get_sitemap_url_count')
  
  if (countError) {
    throw new Error(`Failed to get URL count: ${countError.message}`)
  }
  
  const totalUrls = countData?.total_urls || 0
  const urlsPerFile = 5000 // Maximum URLs per sitemap file
  const sitemapCount = Math.ceil(totalUrls / urlsPerFile)
  const hostUrl = Deno.env.get('SITE_URL') || 'https://soundraiser.io'

  // Generate sitemap index XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  
  for (let i = 1; i <= sitemapCount; i++) {
    xml += '  <sitemap>\n'
    xml += `    <loc>${hostUrl}/sitemap-${i}.xml</loc>\n`
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`
    xml += '  </sitemap>\n'
  }
  
  xml += '</sitemapindex>'
  
  // Cache the result
  await supabaseAdmin
    .from('sitemap_cache')
    .upsert(
      { name: 'sitemap.xml', content: xml, updated_at: new Date().toISOString() },
      { onConflict: 'name' }
    )
  
  console.log(`Generated sitemap index with ${sitemapCount} sitemaps`)
  
  return new Response(xml, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': `public, max-age=${CACHE_DURATION}, stale-while-revalidate=86400`
    }
  })
}

async function serveSitemapFile(fileParam: string) {
  console.log(`Serving sitemap file: ${fileParam}`)
  
  // Check if requested file follows pattern sitemap-N.xml where N is a number
  const fileMatch = fileParam.match(/^(\d+)$/)
  if (!fileMatch) {
    throw new Error('Invalid sitemap file requested')
  }
  
  const fileNum = parseInt(fileMatch[1], 10)
  if (isNaN(fileNum) || fileNum < 1) {
    throw new Error('Invalid sitemap file number')
  }
  
  const cacheKey = `sitemap-${fileNum}.xml`
  
  // Check cache first
  const { data: cacheData, error: cacheError } = await supabaseAdmin
    .from('sitemap_cache')
    .select('content, updated_at')
    .eq('name', cacheKey)
    .maybeSingle()
    
  // If cache is valid and not too old, use it
  if (cacheData && !cacheError && cacheData.content) {
    const cacheAge = Date.now() - new Date(cacheData.updated_at).getTime()
    if (cacheAge < CACHE_DURATION * 1000) {
      console.log(`Serving ${cacheKey} from cache`)
      return new Response(cacheData.content, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=UTF-8',
          'Cache-Control': `public, max-age=${CACHE_DURATION}, stale-while-revalidate=86400`
        }
      })
    }
  }
  
  // Cache miss or expired, generate sitemap file
  const urlsPerFile = 5000
  const offset = (fileNum - 1) * urlsPerFile
  
  // Fetch URLs for this sitemap file
  const { data: urls, error: urlsError } = await supabaseAdmin
    .rpc('get_sitemap_urls_fixed', { p_offset: offset, p_limit: urlsPerFile })
    
  if (urlsError) {
    console.error('Error fetching sitemap URLs:', urlsError)
    throw new Error(`Failed to fetch URLs for sitemap ${fileNum}: ${urlsError.message}`)
  }
  
  if (!urls || urls.length === 0) {
    console.error(`Sitemap ${fileNum} not found or empty`)
    throw new Error(`Sitemap not found: sitemap-${fileNum}.xml`)
  }
  
  const hostUrl = Deno.env.get('SITE_URL') || 'https://soundraiser.io'
  
  // Generate sitemap XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  
  for (const item of urls) {
    xml += '  <url>\n'
    xml += `    <loc>${hostUrl}${item.url}</loc>\n`
    xml += `    <lastmod>${new Date(item.updated_at).toISOString()}</lastmod>\n`
    xml += `    <changefreq>${item.changefreq}</changefreq>\n`
    xml += `    <priority>${item.priority}</priority>\n`
    xml += '  </url>\n'
  }
  
  xml += '</urlset>'
  
  // Cache the result
  await supabaseAdmin
    .from('sitemap_cache')
    .upsert(
      { name: cacheKey, content: xml, updated_at: new Date().toISOString() },
      { onConflict: 'name' }
    )
    
  console.log(`Generated ${cacheKey} with ${urls.length} URLs`)
  
  return new Response(xml, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': `public, max-age=${CACHE_DURATION}, stale-while-revalidate=86400`
    }
  })
}
