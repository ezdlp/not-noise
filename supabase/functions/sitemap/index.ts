
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

    console.log(`Total URLs: ${totalUrls}, Segments needed: ${totalFiles}`)

    // If no segment is specified, return the sitemap index
    if (!sitemapSegment) {
      const sitemapIndex = generateSitemapIndex(siteUrl, totalFiles)
      
      return new Response(sitemapIndex, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600',
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
    const xml = generateSitemapXml(urls as SitemapUrl[], siteUrl)

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
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

function generateSitemapIndex(siteUrl: string, totalFiles: number): string {
  const sitemaps = Array.from({ length: totalFiles }, (_, i) => `
    <sitemap>
      <loc>${siteUrl}/sitemap-${i + 1}.xml</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
  `).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps}
</sitemapindex>`
}

function generateSitemapXml(urls: SitemapUrl[], siteUrl: string): string {
  const urlElements = urls.map(url => `
    <url>
      <loc>${siteUrl}${url.url}</loc>
      <lastmod>${new Date(url.updated_at).toISOString()}</lastmod>
      <changefreq>${url.changefreq}</changefreq>
      <priority>${url.priority}</priority>
    </url>
  `).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlElements}
</urlset>`
}
