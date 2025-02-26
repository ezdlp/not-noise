
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'

interface SitemapUrl {
  url: string
  updated_at: string
  changefreq: string
  priority: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const sitemapSegment = url.searchParams.get('segment')
  const sitemapType = url.searchParams.get('type') || 'all'
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const siteUrl = Deno.env.get('SITE_URL') || 'https://soundraiser.io'

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })

    // Get total URL count
    const { data: countData, error: countError } = await supabaseClient
      .rpc('get_sitemap_url_count')

    if (countError) {
      console.error('Error fetching URL count:', countError)
      throw countError
    }

    const totalUrls = countData[0].total_urls
    const urlsPerFile = 50000 // Google's recommended limit
    const totalFiles = Math.ceil(totalUrls / urlsPerFile)

    console.log(`Total URLs: ${totalUrls}, Segments needed: ${totalFiles}, Type: ${sitemapType}`)

    // If no segment is specified, return the sitemap index
    if (!sitemapSegment) {
      const sitemapIndex = generateSitemapIndex(siteUrl, totalFiles, sitemapType)
      
      return new Response(sitemapIndex, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=UTF-8',
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          'X-Robots-Tag': 'noindex',
        },
      })
    }

    // Get URLs for the requested segment
    const segmentNumber = parseInt(sitemapSegment)
    if (isNaN(segmentNumber) || segmentNumber < 1 || segmentNumber > totalFiles) {
      throw new Error('Invalid sitemap segment')
    }

    const offset = (segmentNumber - 1) * urlsPerFile
    const { data: urls, error } = await supabaseClient
      .rpc('get_sitemap_urls_paginated', {
        p_offset: offset,
        p_limit: urlsPerFile
      })

    if (error) {
      console.error('Error fetching sitemap URLs:', error)
      throw error
    }

    if (!urls || urls.length === 0) {
      console.warn('No URLs returned for segment:', segmentNumber)
      throw new Error('No URLs found')
    }

    console.log(`Generated sitemap segment ${segmentNumber} with ${urls.length} URLs`)

    // Generate XML sitemap for the segment
    const xml = generateSitemapXml(urls as SitemapUrl[], siteUrl, sitemapType)

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Robots-Tag': 'noindex',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(JSON.stringify({ 
      error: 'Error generating sitemap',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

function generateSitemapIndex(siteUrl: string, totalFiles: number, type: string): string {
  const now = new Date().toISOString()
  const sitemaps = [
    `<sitemap>
      <loc>${siteUrl}/sitemap-main.xml</loc>
      <lastmod>${now}</lastmod>
    </sitemap>`,
    `<sitemap>
      <loc>${siteUrl}/sitemap-blog.xml</loc>
      <lastmod>${now}</lastmod>
    </sitemap>`,
    ...Array.from({ length: totalFiles }, (_, i) => 
    `    <sitemap>
      <loc>${siteUrl}/sitemap-${i + 1}.xml</loc>
      <lastmod>${now}</lastmod>
    </sitemap>`)
  ].join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
              xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
              xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${sitemaps}
</sitemapindex>`
}

function generateSitemapXml(urls: SitemapUrl[], siteUrl: string, type: string): string {
  const urlElements = urls.map(url => {
    const loc = `${siteUrl}${url.url}`
    const lastmod = new Date(url.updated_at).toISOString()
    
    // Add image and news tags for specific content types
    const additionalTags = url.url.startsWith('/blog/') 
      ? `    <news:news>
        <news:publication>
          <news:name>Soundraiser</news:name>
          <news:language>en</news:language>
        </news:publication>
        <news:publication_date>${lastmod}</news:publication_date>
        <news:title>Blog Post</news:title>
      </news:news>`
      : ''

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${additionalTags}
  </url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlElements}
</urlset>`
}
