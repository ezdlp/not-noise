
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { corsHeaders } from '../_shared/cors.ts'

interface SitemapEntry {
  url: string;
  updated_at: string;
  changefreq: string;
  priority: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch sitemap data
    const { data: sitemap_data, error } = await supabaseClient
      .rpc('get_sitemap_urls_paginated', { 
        p_offset: 0,
        p_limit: 1000
      })

    if (error) {
      console.error('Error fetching sitemap data:', error)
      throw error
    }

    // Base URL from environment
    const baseUrl = 'https://soundraiser.io'

    // Define static routes
    const staticUrls = [
      '',
      '/blog',
      '/pricing',
      '/spotify-playlist-promotion',
      '/streaming-calculator'
    ]

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map(url => `  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
${sitemap_data?.map((entry: SitemapEntry) => `  <url>
    <loc>${baseUrl}${entry.url}</loc>
    <lastmod>${new Date(entry.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n') || ''}
</urlset>`

    // Return the sitemap with proper headers
    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      }
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(JSON.stringify({ error: 'Error generating sitemap' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})
