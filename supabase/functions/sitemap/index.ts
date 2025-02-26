
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { gzip } from "https://deno.land/x/compress@v0.4.5/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function generateSitemapXML(segment?: string): Promise<string> {
  const baseUrl = 'https://soundraiser.io'
  const now = new Date().toISOString()

  try {
    if (segment === 'index') {
      // Generate sitemap index
      const { data: count } = await supabaseClient.rpc('get_sitemap_url_count')
      const totalUrls = count?.[0]?.total_urls || 0
      const totalSitemaps = Math.ceil(totalUrls / 1000)

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
      xml += '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n'
      xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

      // Add main sitemap for static pages
      xml += `  <sitemap>
    <loc>${baseUrl}/sitemap-main.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>\n`

      // Add blog sitemap
      xml += `  <sitemap>
    <loc>${baseUrl}/sitemap-blog.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>\n`

      xml += '</sitemapindex>'
      return xml
    } else if (segment === 'main') {
      // Generate sitemap for static pages
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
      xml += '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n'
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

      // Add static pages
      const staticPages = [
        { url: '/', priority: 1.0, changefreq: 'weekly' },
        { url: '/pricing', priority: 0.9, changefreq: 'weekly' },
        { url: '/spotify-playlist-promotion', priority: 0.9, changefreq: 'weekly' },
        { url: '/spotify-royalty-calculator', priority: 0.8, changefreq: 'monthly' },
        { url: '/blog', priority: 0.9, changefreq: 'daily' },
        { url: '/create', priority: 0.8, changefreq: 'weekly' },
      ]

      for (const page of staticPages) {
        xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`
      }

      xml += '</urlset>'
      return xml
    } else {
      // Generate paginated sitemap for dynamic content
      const offset = segment ? parseInt(segment) * 1000 : 0
      const { data: urls } = await supabaseClient.rpc('get_sitemap_urls_paginated', {
        p_offset: offset,
        p_limit: 1000
      })

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
      xml += '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n'
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

      if (urls) {
        for (const url of urls) {
          xml += `  <url>
    <loc>${baseUrl}${url.url}</loc>
    <lastmod>${url.updated_at}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>\n`
        }
      }

      xml += '</urlset>'
      return xml
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
    throw new Error('Failed to generate sitemap')
  }
}

async function handleSitemapRequest(req: Request): Promise<Response> {
  try {
    // Extract segment from URL if present
    const url = new URL(req.url)
    const segment = url.searchParams.get('segment') || undefined

    // Generate XML content
    const xml = await generateSitemapXML(segment)

    // Check cache first
    const cacheKey = segment || 'index'
    const etag = `"${await crypto.subtle.digest("SHA-1", new TextEncoder().encode(xml)).then(hash => 
      Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    )}"`

    // Check if content is fresh
    const ifNoneMatch = req.headers.get('if-none-match')
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          'ETag': etag,
        },
      })
    }

    // Compress content
    const compressedContent = await gzip(new TextEncoder().encode(xml))

    // Store in cache
    await supabaseClient
      .from('sitemap_cache')
      .upsert({
        key: cacheKey,
        content: xml,
        etag: etag,
        updated_at: new Date().toISOString()
      })

    return new Response(compressedContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Encoding': 'gzip',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'ETag': etag,
      },
    })
  } catch (error) {
    console.error('Error handling sitemap request:', error)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><error>Internal Server Error</error>',
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
        },
      }
    )
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders
    })
  }

  return handleSitemapRequest(req)
})
