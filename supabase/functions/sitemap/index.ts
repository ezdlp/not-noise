
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Fetch sitemap URLs from our database function
    const { data: urls, error } = await supabaseClient
      .rpc('get_sitemap_urls')

    if (error) {
      console.error('Error fetching sitemap URLs:', error)
      throw error
    }

    // Generate XML sitemap
    const xml = generateSitemapXml(urls as SitemapUrl[])

    // Return the XML with appropriate headers
    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(JSON.stringify({ error: 'Error generating sitemap' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlElements = urls.map(url => `
    <url>
      <loc>https://soundraiser.io${url.url}</loc>
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
